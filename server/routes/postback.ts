import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  platformsTable,
  usersTable,
  balancesTable,
  transactionsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

/**
 * Generic offerwall postback handler.
 *
 * Supports two URL formats:
 *
 *   1) Standard — /api/postback/{platformId}
 *      https://DOMAIN/api/postback/10?user_id={USER_ID}&amount={AMOUNT}&txid={TXN_ID}&secret={SECRET}
 *
 *   2) Fixed-path — /file  (CPX Research and any platform that uses a fixed URL path)
 *      Platform is identified automatically by matching the hash param against the stored secretKey.
 *      No pid needed — just copy the URL and paste it in the offerwall dashboard.
 *      https://DOMAIN/file?status={status}&trans_id={trans_id}&user_id={user_id}&amount_usd={amount_usd}&hash={secure_hash}
 *
 *      Optional: you may also add &pid={platformId} as a static param to force a specific platform.
 *
 * Param aliases (custom names from platform settings take priority):
 *   user_id  →  uid, user
 *   amount   →  reward, payout, coins, amount_usd, amount_local
 *   txid     →  trans_id, transaction_id, offer_id, tid, oid
 *   secret   →  hash, key, sig
 */

// ─── Shared processing logic ──────────────────────────────────────────────────

async function handlePostback(
  platform: typeof platformsTable.$inferSelect,
  q: Record<string, string>,
  res: Response,
) {
  if (!platform.isEnabled) {
    res.status(403).send("ERROR: Platform disabled");
    return;
  }

  // Resolve param values — custom names from platform settings first, then built-in aliases
  const userId =
    (platform.paramUserId ? q[platform.paramUserId] : undefined) ??
    q.user_id ?? q.uid ?? q.user ?? "";

  const rawAmt =
    (platform.paramAmount ? q[platform.paramAmount] : undefined) ??
    q.amount ?? q.reward ?? q.payout ?? q.coins ?? q.amount_usd ?? q.amount_local ?? "";

  const txid =
    (platform.paramTxid ? q[platform.paramTxid] : undefined) ??
    q.txid ?? q.trans_id ?? q.transaction_id ?? q.offer_id ?? q.tid ?? q.oid ?? "";

  const secret = q.secret ?? q.hash ?? q.key ?? q.sig ?? "";

 // FIXED: missing operators (||)
  if (!userId || !rawAmt || !txid) {
    logger.warn({ q, platformId: platform.id }, "Postback: missing required params");
    res.status(400).send("ERROR: Missing required params");
    return;
  }

  const amount = parseFloat(rawAmt);

  // FIXED: missing operators (||)
  if (isNaN(amount) || amount <= 0) {
    logger.warn({ rawAmt }, "Postback: invalid amount");
    res.status(400).send("ERROR: Invalid amount");
    return;
  }

  // User receives 67% of the incoming amount
  const userAmount = amount * 0.67;

  if (platform.secretKey) {
    // FIXED: missing operator (||)
    if (!secret || secret !== platform.secretKey) {
      logger.warn({ platformId: platform.id, secret: "***" }, "Postback: invalid secret");
      res.status(403).send("ERROR: Invalid secret");
      return;
    }
  }

  const uid = parseInt(userId);
  if (isNaN(uid)) {
    res.status(400).send("ERROR: Invalid user_id");
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, uid))
    .limit(1);

  if (!user || user.status !== "active") {
    logger.warn({ uid }, "Postback: user not found or not active");
    res.status(404).send("ERROR: User not found");
    return;
  }

 const description = `[${platform.name}] Offer #${txid}`;
  const [duplicate] = await db
    .select({ id: transactionsTable.id })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, uid),
        eq(transactionsTable.description, description),
      ),
    )
    .limit(1);

  if (duplicate) {
    logger.info({ uid, txid }, "Postback: duplicate transaction, ignoring");
    res.send("OK");
    return;
  }

  await db.transaction(async (tx) => {
    let [balance] = await tx
      .select()
      .from(balancesTable)
      .where(eq(balancesTable.userId, uid))
      .limit(1);

    if (!balance) {
      [balance] = await tx
        .insert(balancesTable)
        .values({ userId: uid })
        .returning();
    }

    const before = parseFloat(balance.balance);
    const after  = before + userAmount;

    await tx
      .update(balancesTable)
      .set({
        balance:      after.toFixed(8),
        totalEarned:  (parseFloat(balance.totalEarned) + userAmount).toFixed(8),
        updatedAt:    new Date(),
      })
      .where(eq(balancesTable.userId, uid));

    await tx.insert(transactionsTable).values({
      userId:        uid,
      type:          "earning",
      amount:        userAmount.toFixed(8),
      balanceBefore: before.toFixed(8),
      balanceAfter:  after.toFixed(8),
      description,
      status:        "completed",
    });
  });

  logger.info({ uid, amount: userAmount, platform: platform.name, txid }, "Postback: credited");
  res.send("OK");
}


// ─── Helper: load platform by ID ─────────────────────────────────────────────

async function loadPlatformById(
  platformId: number,
  res: Response,
): Promise<typeof platformsTable.$inferSelect | null> {
  const [platform] = await db
    .select()
    .from(platformsTable)
    .where(eq(platformsTable.id, platformId))
    .limit(1);

  if (!platform) {
    logger.warn({ platformId }, "Postback: platform not found");
    res.status(404).send("ERROR: Platform not found");
    return null;
  }

  return platform;
}

// ─── Route 1: /api/postback/:platformId  (standard) ──────────────────────────

router.get("/postback/:platformId", async (req: Request, res: Response) => {
  const platformId = parseInt(req.params.platformId as string);

  if (isNaN(platformId)) {
    logger.warn("Postback: invalid platformId");
    res.status(400).send("ERROR: Invalid platform");
    return;
  }

  const platform = await loadPlatformById(platformId, res);
  if (!platform) return;

  await handlePostback(platform, req.query as Record<string, string>, res);
});

// ─── Route 2: /file  (CPX Research and platforms using a fixed path) ──────────
//
// Platform is identified in order:
//   1. ?pid={platformId}  — static param you can add to the URL in the offerwall dashboard
//   2. ?hash={secretKey}  — automatic: matches the hash param against stored secretKey
//                           (CPX Research sends the raw security hash — no pid needed)
//
// CPX Research postback URL to paste in dashboard (replace hash with your Security Hash):
//   https://DOMAIN/file?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}

router.get("/file", async (req: Request, res: Response) => {
  const q = req.query as Record<string, string>;

  let platform: typeof platformsTable.$inferSelect | null = null;

  // --- Method 1: explicit pid param ---
  const pid = parseInt(q.pid || "");
  if (!isNaN(pid)) {
    platform = await loadPlatformById(pid, res);
    if (!platform) return;
  }

  // --- Method 2: match hash param against stored secretKey (CPX Research, no pid needed) ---
  if (!platform) {
    const hashVal = q.hash ?? q.secret ?? q.key ?? q.sig ?? "";
    if (hashVal) {
      const [found] = await db
        .select()
        .from(platformsTable)
        .where(eq(platformsTable.secretKey, hashVal))
        .limit(1);

      if (found) {
        platform = found;
      }
    }
  }

  if (!platform) {
    logger.warn({ q }, "Postback /file: cannot identify platform");
    res
      .status(400)
      .send(
        "ERROR: Cannot identify platform. " +
        "Either add &pid={PLATFORM_ID} to the URL, " +
        "or make sure the Secret Key in admin matches the hash sent by the offerwall.",
      );
    return;
  }

  await handlePostback(platform, q, res);
});

export default router;
