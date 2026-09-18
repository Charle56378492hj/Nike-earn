import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, balancesTable, adminsTable, transactionsTable } from "@workspace/db";
import { eq, ilike, or, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { UpdateUserBody, AdjustUserBalanceBody, UpdateProfileBody, ChangePasswordBody } from "@workspace/api-zod";
import { hashPassword, comparePassword } from "../lib/auth";

const router = Router();

async function getUserWithBalance(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) return null;
  const [balance] = await db.select().from(balancesTable).where(eq(balancesTable.userId, userId)).limit(1);
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.userId, userId)).limit(1);
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    isAdmin: !!admin?.isActive,
    isSuperAdmin: admin?.role === "super_admin" && admin?.isActive === true,
    createdAt: user.createdAt.toISOString(),
    balance: balance?.balance ?? "0",
    totalEarned: balance?.totalEarned ?? "0",
    totalWithdrawn: balance?.totalWithdrawn ?? "0",
  };
}

router.get("/users", requireAdmin, async (req, res) => {
  const page = parseInt(String(req.query.page ?? "1")) || 1;
  const limit = parseInt(String(req.query.limit ?? "20")) || 20;
  const search = String(req.query.search ?? "");
  const offset = (page - 1) * limit;

  let query = db
    .select({
      user: usersTable,
      balance: balancesTable,
      admin: adminsTable,
    })
    .from(usersTable)
    .leftJoin(balancesTable, eq(usersTable.id, balancesTable.userId))
    .leftJoin(adminsTable, eq(usersTable.id, adminsTable.userId))
    .$dynamic();

  if (search) {
    query = query.where(
      or(
        ilike(usersTable.email, `%${search}%`),
        ilike(usersTable.username, `%${search}%`)
      )
    );
  }

  const rows = await query
    .orderBy(desc(usersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const users = rows.map(({ user, balance, admin }) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    isAdmin: !!admin?.isActive,
    isSuperAdmin: admin?.role === "super_admin" && admin?.isActive === true,
    createdAt: user.createdAt.toISOString(),
    balance: balance?.balance ?? "0",
    totalEarned: balance?.totalEarned ?? "0",
    totalWithdrawn: balance?.totalWithdrawn ?? "0",
  }));

  res.json({ users, total: users.length, page, limit });
});

router.get("/users/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId as string);
  const user = await getUserWithBalance(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch("/users/:userId", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId as string);
  const parsed = UpdateUserBody.safeParse(req.body);

  if (!parsed.success || isNaN(userId)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  const user = await getUserWithBalance(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.patch("/users/:userId/balance", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.userId as string);
  const parsed = AdjustUserBalanceBody.safeParse(req.body);

  if (!parsed.success || isNaN(userId)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { amount, reason } = parsed.data;
  const adjustment = parseFloat(amount);

  if (isNaN(adjustment)) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [balance] = await db
    .select()
    .from(balancesTable)
    .where(eq(balancesTable.userId, userId))
    .limit(1);

  if (!balance) {
    res.status(404).json({ error: "User balance not found" });
    return;
  }

  const balanceBefore = balance.balance;
  const newBalance = Math.max(0, parseFloat(balance.balance) + adjustment);
  const balanceAfter = newBalance.toFixed(8);

  await db
    .update(balancesTable)
    .set({
      balance: balanceAfter,
      totalEarned:
        adjustment > 0
          ? (parseFloat(balance.totalEarned) + adjustment).toFixed(8)
          : balance.totalEarned,
      updatedAt: new Date(),
    })
    .where(eq(balancesTable.userId, userId));

  await db.insert(transactionsTable).values({
    userId,
    type: "adjustment",
    amount: adjustment.toFixed(8),
    balanceBefore,
    balanceAfter,
    description: `Admin adjustment: ${reason}`,
    status: "completed",
  });

  res.json({ message: "Balance adjusted successfully" });
});

router.patch("/settings/profile", requireAuth, async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.userId, req.userId!))
    .limit(1);

  res.json({
    id: updated.id,
    email: updated.email,
    username: updated.username,
    status: updated.status,
    isAdmin: !!admin?.isActive,
    isSuperAdmin: admin?.role === "super_admin" && admin?.isActive === true,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.patch("/settings/password", requireAuth, async (req, res) => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user?.passwordHash) {
    res.status(400).json({ error: "No password set" });
    return;
  }

  const valid = await comparePassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(usersTable)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!));

  res.json({ message: "Password changed successfully" });
});

export default router;
