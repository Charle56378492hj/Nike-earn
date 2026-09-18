import { Router } from "express";
import { db } from "@workspace/db";
import { withdrawalsTable, balancesTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import {
  CreateWithdrawalBody,
  UpdateWithdrawalStatusBody,
  ListWithdrawalsQueryParams,
  ListAllWithdrawalsQueryParams,
} from "@workspace/api-zod";

const router = Router();

const MIN_WITHDRAWAL = 1;

function formatWithdrawal(w: typeof withdrawalsTable.$inferSelect) {
  return {
    ...w,
    amount: w.amount,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

router.get("/withdrawals", requireAuth, async (req, res) => {
  const parsed = ListWithdrawalsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const withdrawals = await db
    .select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, req.userId!))
    .orderBy(desc(withdrawalsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    withdrawals: withdrawals.map(formatWithdrawal),
    total: withdrawals.length,
    page,
    limit,
  });
});

router.post("/withdrawals", requireAuth, async (req, res) => {
  const parsed = CreateWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { amount, network, walletAddress } = parsed.data;
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum) || amountNum < MIN_WITHDRAWAL) {
    res.status(400).json({ error: `Minimum withdrawal is $${MIN_WITHDRAWAL}` });
    return;
  }

  const [balance] = await db
    .select()
    .from(balancesTable)
    .where(eq(balancesTable.userId, req.userId!))
    .limit(1);

  if (!balance || parseFloat(balance.balance) < amountNum) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const balanceBefore = balance.balance;
  const balanceAfter = (parseFloat(balance.balance) - amountNum).toFixed(8);

  const [withdrawal] = await db
    .insert(withdrawalsTable)
    .values({
      userId: req.userId!,
      amount: amountNum.toFixed(8),
      network,
      walletAddress,
      status: "pending",
    })
    .returning();

  await db
    .update(balancesTable)
    .set({
      balance: balanceAfter,
      totalWithdrawn: (parseFloat(balance.totalWithdrawn) + amountNum).toFixed(8),
      updatedAt: new Date(),
    })
    .where(eq(balancesTable.userId, req.userId!));

  await db.insert(transactionsTable).values({
    userId: req.userId!,
    type: "withdrawal",
    amount: (-amountNum).toFixed(8),
    balanceBefore,
    balanceAfter,
    description: `Withdrawal request #${withdrawal.id} via ${network}`,
    status: "pending",
  });

  res.json(formatWithdrawal(withdrawal));
});

router.get("/withdrawals/all", requireAdmin, async (req, res) => {
  const parsed = ListAllWithdrawalsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const offset = (page - 1) * limit;

  const withdrawals = await db
    .select({
      withdrawal: withdrawalsTable,
      username: usersTable.username,
      email: usersTable.email,
    })
    .from(withdrawalsTable)
    .innerJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
    .orderBy(desc(withdrawalsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    withdrawals: withdrawals.map(({ withdrawal, username, email }) => ({
      ...formatWithdrawal(withdrawal),
      username,
      email,
    })),
    total: withdrawals.length,
    page,
    limit,
  });
});

router.patch("/withdrawals/:withdrawalId/status", requireAdmin, async (req, res) => {
  const withdrawalId = parseInt(req.params.withdrawalId as string);
  const parsed = UpdateWithdrawalStatusBody.safeParse(req.body);

  if (!parsed.success || isNaN(withdrawalId)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { status, adminNote, txHash } = parsed.data;

  const [existing] = await db
    .select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.id, withdrawalId))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  if (status === "rejected" && existing.status === "pending") {
    const [balance] = await db
      .select()
      .from(balancesTable)
      .where(eq(balancesTable.userId, existing.userId))
      .limit(1);

    if (balance) {
      const refundAmount = parseFloat(existing.amount);
      const newBalance = (parseFloat(balance.balance) + refundAmount).toFixed(8);
      await db
        .update(balancesTable)
        .set({
          balance: newBalance,
          totalWithdrawn: (parseFloat(balance.totalWithdrawn) - refundAmount).toFixed(8),
          updatedAt: new Date(),
        })
        .where(eq(balancesTable.userId, existing.userId));

      await db.insert(transactionsTable).values({
        userId: existing.userId,
        type: "refund",
        amount: refundAmount.toFixed(8),
        balanceBefore: balance.balance,
        balanceAfter: newBalance,
        description: `Withdrawal #${withdrawalId} rejected — refunded`,
        status: "completed",
      });
    }
  }

  const [updated] = await db
    .update(withdrawalsTable)
    .set({
      status,
      adminNote: adminNote ?? existing.adminNote,
      txHash: txHash ?? existing.txHash,
      updatedAt: new Date(),
    })
    .where(eq(withdrawalsTable.id, withdrawalId))
    .returning();

  res.json(formatWithdrawal(updated));
});

export default router;
