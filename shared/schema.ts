import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const detectedEvents = pgTable("detected_events", {
  id: serial("id").primaryKey(),
  messageText: text("message_text").notNull(),
  senderName: text("sender_name"),
  eventName: text("event_name").notNull(),
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration").notNull().default(60),
  location: text("location"),
  notes: text("notes"),
  confidenceScore: real("confidence_score").notNull(),
  status: text("status").notNull().default("pending"),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDetectedEventSchema = createInsertSchema(detectedEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DetectedEvent = typeof detectedEvents.$inferSelect;
export type InsertDetectedEvent = z.infer<typeof insertDetectedEventSchema>;
