import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  balancesTable,
  withdrawalsTable,
  transactionsTable,
  platformsTable,
} from "@workspace/db";
import { eq, and, gte, inArray, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req, res) => {
  const [balance] = await db
    .select()
    .from(balancesTable)
    .where(eq(balancesTable.userId, req.userId!))
    .limit(1);

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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTxs = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, req.userId!),
        eq(transactionsTable.type, "earning"),
        gte(transactionsTable.createdAt, sevenDaysAgo)
      )
    );

  const recentEarnings = recentTxs
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    .toFixed(8);

  const completedOffers = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, req.userId!),
        eq(transactionsTable.type, "earning")
      )
    );

  res.json({
    balance: balance?.balance ?? "0",
    totalEarned: balance?.totalEarned ?? "0",
    totalWithdrawn: balance?.totalWithdrawn ?? "0",
    pendingWithdrawals: pendingAmount,
    completedOffers: Number(completedOffers[0]?.count ?? 0),
    recentEarnings,
  });
});

router.get("/dashboard/admin-stats", requireAdmin, async (_req, res) => {
  const [totalUsersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable);

  const [activeUsersResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(eq(usersTable.status, "active"));

  const [totalPlatformsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(platformsTable);

  const [pendingWithdrawalsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.status, "pending"));

  const allBalances = await db.select().from(balancesTable);
  const totalBalance = allBalances
    .reduce((sum, b) => sum + parseFloat(b.balance), 0)
    .toFixed(8);
  const totalWithdrawn = allBalances
    .reduce((sum, b) => sum + parseFloat(b.totalWithdrawn), 0)
    .toFixed(8);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [newUsersTodayResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(gte(usersTable.createdAt, today));

  const [withdrawalsTodayResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(withdrawalsTable)
    .where(gte(withdrawalsTable.createdAt, today));

  res.json({
    totalUsers: Number(totalUsersResult?.count ?? 0),
    activeUsers: Number(activeUsersResult?.count ?? 0),
    totalPlatforms: Number(totalPlatformsResult?.count ?? 0),
    pendingWithdrawals: Number(pendingWithdrawalsResult?.count ?? 0),
    totalWithdrawnAllTime: totalWithdrawn,
    totalBalanceInSystem: totalBalance,
    newUsersToday: Number(newUsersTodayResult?.count ?? 0),
    withdrawalsToday: Number(withdrawalsTodayResult?.count ?? 0),
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res) => {
  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, req.userId!))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(10);

  const activities = transactions.map((t) => ({
    id: t.id,
    type: t.type,
    description: t.description,
    amount: t.amount,
    createdAt: t.createdAt.toISOString(),
  }));

  res.json({ activities });
});

export default router;
