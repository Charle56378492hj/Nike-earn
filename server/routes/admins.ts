import { Router } from "express";
import { db } from "@workspace/db";
import { adminsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireSuperAdmin } from "../lib/auth";
import { CreateAdminBody, UpdateAdminBody } from "@workspace/api-zod";

const router = Router();

async function getAdminWithUser(adminId: number) {
  const [result] = await db
    .select({
      admin: adminsTable,
      user: usersTable,
    })
    .from(adminsTable)
    .innerJoin(usersTable, eq(adminsTable.userId, usersTable.id))
    .where(eq(adminsTable.id, adminId))
    .limit(1);
  return result;
}

function formatAdmin(
  admin: typeof adminsTable.$inferSelect,
  user: typeof usersTable.$inferSelect
) {
  return {
    id: admin.id,
    userId: admin.userId,
    email: user.email,
    username: user.username,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive,
    createdAt: admin.createdAt.toISOString(),
  };
}

router.get("/admins", requireSuperAdmin, async (_req, res) => {
  const admins = await db
    .select({ admin: adminsTable, user: usersTable })
    .from(adminsTable)
    .innerJoin(usersTable, eq(adminsTable.userId, usersTable.id));

  res.json({ admins: admins.map(({ admin, user }) => formatAdmin(admin, user)) });
});

router.post("/admins", requireSuperAdmin, async (req, res) => {
  const parsed = CreateAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, parsed.data.userId))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [admin] = await db
    .insert(adminsTable)
    .values({
      userId: parsed.data.userId,
      role: parsed.data.role,
      permissions: parsed.data.permissions ?? [],
    })
    .onConflictDoNothing()
    .returning();

  if (!admin) {
    res.status(400).json({ error: "User is already an admin" });
    return;
  }

  res.json(formatAdmin(admin, user));
});

router.patch("/admins/:adminId", requireSuperAdmin, async (req, res) => {
  const adminId = parseInt(req.params.adminId as string);
  const parsed = UpdateAdminBody.safeParse(req.body);

  if (!parsed.success || isNaN(adminId)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(adminsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(adminsTable.id, adminId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  const result = await getAdminWithUser(adminId);
  if (!result) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  res.json(formatAdmin(result.admin, result.user));
});

router.delete("/admins/:adminId", requireSuperAdmin, async (req, res) => {
  const adminId = parseInt(req.params.adminId as string);
  if (isNaN(adminId)) {
    res.status(400).json({ error: "Invalid admin ID" });
    return;
  }

  await db.delete(adminsTable).where(eq(adminsTable.id, adminId));
  res.json({ message: "Admin removed" });
});

export default router;
