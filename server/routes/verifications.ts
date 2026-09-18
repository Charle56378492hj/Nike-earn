import { Router } from "express";
import { db } from "@workspace/db";
import { emailVerificationsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/admin/pending-verifications", requireAdmin, async (_req, res) => {
  const now = new Date();
  const pending = await db
    .select()
    .from(emailVerificationsTable)
    .where(
      and(
        eq(emailVerificationsTable.used, false),
        gt(emailVerificationsTable.expiresAt, now)
      )
    )
    .orderBy(emailVerificationsTable.createdAt);

  res.json({
    verifications: pending.map((v) => ({
      id: v.id,
      email: v.email,
      username: v.username,
      code: v.code,
      expiresAt: v.expiresAt.toISOString(),
      createdAt: v.createdAt.toISOString(),
    })),
  });
});

export default router;
