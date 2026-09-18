import { Router } from "express";
import { db } from "@workspace/db";
import { platformsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { CreatePlatformBody, UpdatePlatformBody } from "@workspace/api-zod";

const router = Router();

function formatPlatform(p: typeof platformsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    logoUrl: p.logoUrl,
    apiEndpoint: p.apiEndpoint,
    placement: p.placement,
    isEnabled: p.isEnabled,
    createdAt: p.createdAt.toISOString(),
  };
}

function formatPlatformAdmin(p: typeof platformsTable.$inferSelect) {
  return {
    ...formatPlatform(p),
    secretKey: p.secretKey,
    paramUserId: p.paramUserId,
    paramAmount: p.paramAmount,
    paramTxid: p.paramTxid,
    paramStatus: p.paramStatus,
  };
}

// PUBLIC: get featured platform (placement === "homepage") — no auth required
router.get("/platforms/featured", async (_req, res) => {
  const [platform] = await db
    .select()
    .from(platformsTable)
    .where(and(eq(platformsTable.isEnabled, true), eq(platformsTable.placement, "homepage")))
    .limit(1);

  if (!platform) {
    res.json({ platform: null });
    return;
  }

  res.json({ platform: formatPlatform(platform) });
});

router.get("/platforms", requireAuth, async (_req, res) => {
  const platforms = await db
    .select()
    .from(platformsTable)
    .where(eq(platformsTable.isEnabled, true));

  res.json({ platforms: platforms.map(formatPlatform) });
});

router.get("/platforms/all", requireAdmin, async (_req, res) => {
  const platforms = await db.select().from(platformsTable);
  res.json({ platforms: platforms.map(formatPlatformAdmin) });
});

router.post("/platforms", requireAdmin, async (req, res) => {
  const parsed = CreatePlatformBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [platform] = await db
    .insert(platformsTable)
    .values({
      ...parsed.data,
      isEnabled: parsed.data.isEnabled ?? true,
    })
    .returning();

  res.json(formatPlatformAdmin(platform));
});

router.patch("/platforms/:platformId", requireAdmin, async (req, res) => {
  const platformId = parseInt(req.params.platformId as string);
  const parsed = UpdatePlatformBody.safeParse(req.body);

  if (!parsed.success || isNaN(platformId)) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [updated] = await db
    .update(platformsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(platformsTable.id, platformId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Platform not found" });
    return;
  }

  res.json(formatPlatformAdmin(updated));
});

router.delete("/platforms/:platformId", requireAdmin, async (req, res) => {
  const platformId = parseInt(req.params.platformId as string);
  if (isNaN(platformId)) {
    res.status(400).json({ error: "Invalid platform ID" });
    return;
  }

  await db.delete(platformsTable).where(eq(platformsTable.id, platformId));
  res.json({ message: "Platform deleted" });
});

export default router;
