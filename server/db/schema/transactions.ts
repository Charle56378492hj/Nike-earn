import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", ["earning", "withdrawal", "adjustment", "refund"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending", "failed"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  balanceBefore: numeric("balance_before", { precision: 20, scale: 8 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 20, scale: 8 }).notNull(),
  description: text("description").notNull(),
  status: transactionStatusEnum("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Transaction = typeof transactionsTable.$inferSelect;
