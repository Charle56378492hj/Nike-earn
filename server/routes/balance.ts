import { Router } from "express";
import { db } from "@workspace/db";
import { balancesTable, withdrawalsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/balance", requireAuth, async (req, res) => {
  const [balance] = await db
    .select()
    .from(balancesTable)
    .where(eq(balancesTable.userId, req.userId!))
    .limit(1);

  if (!balance) {
    await db.insert(balancesTable).values({ userId: req.userId! }).returning();
    res.json({ balance: "0", totalEarned: "0", totalWithdrawn: "0", pendingWithdrawals: "0" });
    return;
  }

  const pendingWithdrawals = await db
    .select()
    .from(withdrawalsTable)
    .where(
      and(
        eq(withdrawalsTable.userId, req.userId!),
        inArray(withdrawalsTable.status, ["pending", "approved"])
      )
    );

  const pendingAmount = pendingWithdrawals
    .reduce((sum, w) => sum + parseFloat(w.amount), 0)
    .toFixed(8);

  res.json({
    balance: balance.balance,
    totalEarned: balance.totalEarned,
    totalWithdrawn: balance.totalWithdrawn,
    pendingWithdrawals: pendingAmount,
  });
});

export default router;
