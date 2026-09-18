import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const balancesTable = pgTable("balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 20, scale: 8 }).notNull().default("0"),
  totalEarned: numeric("total_earned", { precision: 20, scale: 8 }).notNull().default("0"),
  totalWithdrawn: numeric("total_withdrawn", { precision: 20, scale: 8 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Balance = typeof balancesTable.$inferSelect;
