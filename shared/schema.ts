import { pgTable, text, timestamp, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  number: text("number").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  purpose: text("purpose"),
  whom_to_meet: text("whom_to_meet"),
  phone_number: text("phone_number"),
  entry_time: timestamp("entry_time", { withTimezone: true }).defaultNow(),
  exit_time: timestamp("exit_time", { withTimezone: true }),
  status: text("status").default("entered").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusCheck: check("status_check", sql`${table.status} IN ('entered', 'exited')`),
}));

export const insertEntrySchema = createInsertSchema(entries).omit({
  id: true,
  number: true,
  entry_time: true,
  exit_time: true,
  created_at: true,
}).extend({
  status: z.enum(["entered", "exited"]).default("entered"),
  purpose: z.string().min(1, "Tujuan berkunjung harus diisi"),
  whom_to_meet: z.string().min(1, "Ketemu siapa harus diisi"),
  phone_number: z.string().min(1, "Nomor handphone harus diisi"),
});

export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;
