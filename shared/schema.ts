import { pgTable, text, timestamp, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  entry_time: timestamp("entry_time", { withTimezone: true }).defaultNow(),
  exit_time: timestamp("exit_time", { withTimezone: true }),
  status: text("status").default("entered").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusCheck: check("status_check", sql`${table.status} IN ('entered', 'exited')`),
}));

export const insertEntrySchema = createInsertSchema(entries).omit({
  id: true,
  entry_time: true,
  exit_time: true,
  created_at: true,
}).extend({
  status: z.enum(["entered", "exited"]).default("entered"),
});

export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;
