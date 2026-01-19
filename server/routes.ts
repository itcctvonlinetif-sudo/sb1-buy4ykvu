import type { Express } from "express";
import { storage } from "./storage";
import { insertEntrySchema } from "../shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): void {
  app.get("/api/entries", async (req, res) => {
    try {
      const filter = req.query.filter as "all" | "entered" | "exited" | undefined;
      const entries = await storage.getEntries(filter || "all");
      res.json(entries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  app.get("/api/entries/:id", async (req, res) => {
    try {
      const entry = await storage.getEntryById(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error fetching entry:", error);
      res.status(500).json({ error: "Failed to fetch entry" });
    }
  });

  app.post("/api/entries", async (req, res) => {
    try {
      const data = insertEntrySchema.parse(req.body);
      const entry = await storage.createEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating entry:", error);
      res.status(500).json({ error: "Failed to create entry" });
    }
  });

  app.post("/api/entries/bulk", async (req, res) => {
    try {
      const bulkSchema = z.array(insertEntrySchema);
      const data = bulkSchema.parse(req.body);
      const entries = await storage.createManyEntries(data);
      res.status(201).json(entries);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating entries:", error);
      res.status(500).json({ error: "Failed to create entries" });
    }
  });

  app.patch("/api/entries/:id/exit", async (req, res) => {
    try {
      const entry = await storage.getEntryById(req.params.id);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }
      
      if (entry.status === "exited") {
        return res.status(400).json({ error: "Entry already exited", entry });
      }

      const updatedEntry = await storage.updateEntryStatus(req.params.id, "exited");
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating entry:", error);
      res.status(500).json({ error: "Failed to update entry" });
    }
  });
}
