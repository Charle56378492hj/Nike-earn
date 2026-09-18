import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  balancesTable,
  adminsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
} from "../lib/auth";
import { sendPasswordResetEmail } from "../lib/email";
import crypto from "crypto";

const router = Router();

function formatUser(
  user: typeof usersTable.$inferSelect,
  adminRecord?: typeof adminsTable.$inferSelect | null
) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    isAdmin: !!adminRecord?.isActive,
    isSuperAdmin:
      adminRecord?.role === "super_admin" && adminRecord?.isActive === true,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, username, password } = parsed.data;

  const [existingEmail] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existingEmail) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [existingUsername] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existingUsername) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      username,
      passwordHash,
      status: "active",
    })
    .returning();

  await db
    .insert(balancesTable)
    .values({ userId: user.id })
    .onConflictDoNothing();

  const isAdminEmail =
    email.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  if (isAdminEmail) {
    await db
      .insert(adminsTable)
      .values({ userId: user.id, role: "super_admin", isActive: true })
      .onConflictDoNothing();
  }

  const [adminRecord] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.userId, user.id))
    .limit(1);

  const token = signToken({ userId: user.id, email: user.email });

  res.json({ user: formatUser(user, adminRecord), token });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.status === "disabled") {
    res.status(401).json({ error: "Account is disabled" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });

  const [adminRecord] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.userId, user.id))
    .limit(1);

  res.json({ user: formatUser(user, adminRecord), token });
});

router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/forgot-password", async (req, res) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (user && user.status === "active") {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { passwordResetsTable } = await import("@workspace/db");
    await db.insert(passwordResetsTable).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await sendPasswordResetEmail(email, token).catch(() => {});
  }

  res.json({ message: "If that email exists, a reset link has been sent" });
});

router.post("/auth/reset-password", async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { token, password } = parsed.data;

  const { passwordResetsTable } = await import("@workspace/db");
  const { and } = await import("drizzle-orm");

  const [reset] = await db
    .select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.token, token),
        eq(passwordResetsTable.used, false)
      )
    )
    .limit(1);

  if (!reset) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  if (new Date() > reset.expiresAt) {
    res.status(400).json({ error: "Reset token has expired" });
    return;
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(usersTable)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(usersTable.id, reset.userId));

  await db
    .update(passwordResetsTable)
    .set({ used: true })
    .where(eq(passwordResetsTable.id, reset.id));

  res.json({ message: "Password reset successfully" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  res.json(formatUser(req.user!, {
    id: 0,
    userId: req.user!.id,
    role: req.user!.isSuperAdmin ? "super_admin" : "admin",
    permissions: [],
    isActive: req.user!.isAdmin,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
});

export default router;
