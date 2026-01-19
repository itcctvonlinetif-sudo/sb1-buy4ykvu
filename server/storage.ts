import { db } from "./db";
import { entries, InsertEntry, Entry } from "../shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getEntries(filter?: "all" | "entered" | "exited"): Promise<Entry[]>;
  getEntryById(id: string): Promise<Entry | undefined>;
  createEntry(data: InsertEntry): Promise<Entry>;
  updateEntryStatus(id: string, status: "entered" | "exited", exitTime?: Date): Promise<Entry | undefined>;
  createManyEntries(data: InsertEntry[]): Promise<Entry[]>;
}

export class DatabaseStorage implements IStorage {
  async getEntries(filter: "all" | "entered" | "exited" = "all"): Promise<Entry[]> {
    if (filter === "all") {
      return await db.select().from(entries).orderBy(desc(entries.created_at));
    }
    return await db.select().from(entries).where(eq(entries.status, filter)).orderBy(desc(entries.created_at));
  }

  async getEntryById(id: string): Promise<Entry | undefined> {
    const [entry] = await db.select().from(entries).where(eq(entries.id, id));
    return entry;
  }

  async createEntry(data: InsertEntry): Promise<Entry> {
    const [entry] = await db.insert(entries).values(data).returning();
    return entry;
  }

  async updateEntryStatus(id: string, status: "entered" | "exited", exitTime?: Date): Promise<Entry | undefined> {
    const [entry] = await db
      .update(entries)
      .set({ 
        status, 
        exit_time: exitTime || (status === "exited" ? new Date() : null) 
      })
      .where(eq(entries.id, id))
      .returning();
    return entry;
  }

  async createManyEntries(data: InsertEntry[]): Promise<Entry[]> {
    if (data.length === 0) return [];
    return await db.insert(entries).values(data).returning();
  }
}

export const storage = new DatabaseStorage();
