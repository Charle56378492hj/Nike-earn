import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { ListTransactionsQueryParams, ListAllTransactionsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/transactions", requireAuth, async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const type = parsed.success ? parsed.data.type : undefined;
  const offset = (page - 1) * limit;

  const conditions = [eq(transactionsTable.userId, req.userId!)];
  if (type) {
    const { sql } = await import("drizzle-orm");
    conditions.push(sql`${transactionsTable.type} = ${type}`);
  }

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const total = await db
    .select({ count: transactionsTable.id })
    .from(transactionsTable)
    .where(and(...conditions));

  res.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      createdAt: t.createdAt.toISOString(),
    })),
    total: total.length,
    page,
    limit,
  });
});

router.get("/transactions/all", requireAdmin, async (req, res) => {
  const parsed = ListAllTransactionsQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const offset = (page - 1) * limit;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({
    transactions: transactions.map((t) => ({
      ...t,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      createdAt: t.createdAt.toISOString(),
    })),
    total: transactions.length,
    page,
    limit,
  });
});

export default router;
