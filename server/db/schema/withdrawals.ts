import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const withdrawalNetworkEnum = pgEnum("withdrawal_network", [
  "BEP20",
  "TRC20",
  "SHAM_CASH",
  "SYRIATEL_CASH",
  "COENEX_EMAIL",
]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "approved", "rejected", "paid"]);

export const withdrawalsTable = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  network: withdrawalNetworkEnum("network").notNull(),
  walletAddress: text("wallet_address").notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Withdrawal = typeof withdrawalsTable.$inferSelect;
