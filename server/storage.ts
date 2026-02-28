import { type User, type InsertUser, type DetectedEvent, type InsertDetectedEvent, users, detectedEvents } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllDetectedEvents(): Promise<DetectedEvent[]>;
  getDetectedEventById(id: number): Promise<DetectedEvent | undefined>;
  createDetectedEvent(event: InsertDetectedEvent): Promise<DetectedEvent>;
  updateDetectedEventStatus(id: number, status: string, calendarEventId?: string): Promise<DetectedEvent>;
  deleteDetectedEvent(id: number): Promise<void>;
  getPendingEvents(): Promise<DetectedEvent[]>;
  getConfirmedEvents(): Promise<DetectedEvent[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllDetectedEvents(): Promise<DetectedEvent[]> {
    return db.select().from(detectedEvents).orderBy(desc(detectedEvents.createdAt));
  }

  async getDetectedEventById(id: number): Promise<DetectedEvent | undefined> {
    const [event] = await db.select().from(detectedEvents).where(eq(detectedEvents.id, id));
    return event;
  }

  async createDetectedEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const [created] = await db.insert(detectedEvents).values(event).returning();
    return created;
  }

  async updateDetectedEventStatus(id: number, status: string, calendarEventId?: string): Promise<DetectedEvent> {
    const [updated] = await db
      .update(detectedEvents)
      .set({ status, ...(calendarEventId ? { calendarEventId } : {}) })
      .where(eq(detectedEvents.id, id))
      .returning();
    return updated;
  }

  async deleteDetectedEvent(id: number): Promise<void> {
    await db.delete(detectedEvents).where(eq(detectedEvents.id, id));
  }

  async getPendingEvents(): Promise<DetectedEvent[]> {
    return db
      .select()
      .from(detectedEvents)
      .where(eq(detectedEvents.status, "pending"))
      .orderBy(desc(detectedEvents.createdAt));
  }

  async getConfirmedEvents(): Promise<DetectedEvent[]> {
    return db
      .select()
      .from(detectedEvents)
      .where(eq(detectedEvents.status, "confirmed"))
      .orderBy(desc(detectedEvents.createdAt));
  }
}

export const storage = new DatabaseStorage();
