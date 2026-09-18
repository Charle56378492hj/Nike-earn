import { pgTable, serial, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const platformPlacementEnum = pgEnum("platform_placement", ["homepage", "sidebar", "dedicated"]);

export const platformsTable = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  apiKey: text("api_key"),
  apiEndpoint: text("api_endpoint"),
  secretKey: text("secret_key"),
  placement: platformPlacementEnum("placement").notNull().default("dedicated"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  // Custom postback param names — optional, fall back to defaults if null
  paramUserId: text("param_user_id"),
  paramAmount: text("param_amount"),
  paramTxid: text("param_txid"),
  paramStatus: text("param_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Platform = typeof platformsTable.$inferSelect;
