import { type User, type InsertUser, type DetectedEvent, type InsertDetectedEvent, users, detectedEvents } from "@shared/schema";
import { db } from "./db";

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
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { eq } = await import("drizzle-orm");
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllDetectedEvents(): Promise<DetectedEvent[]> {
    const { desc } = await import("drizzle-orm");
    return db.select().from(detectedEvents).orderBy(desc(detectedEvents.createdAt));
  }

  async getDetectedEventById(id: number): Promise<DetectedEvent | undefined> {
    const { eq } = await import("drizzle-orm");
    const [event] = await db.select().from(detectedEvents).where(eq(detectedEvents.id, id));
    return event;
  }

  async createDetectedEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const [created] = await db.insert(detectedEvents).values(event).returning();
    return created;
  }

  async updateDetectedEventStatus(id: number, status: string, calendarEventId?: string): Promise<DetectedEvent> {
    const { eq } = await import("drizzle-orm");
    const [updated] = await db
      .update(detectedEvents)
      .set({ status, ...(calendarEventId ? { calendarEventId } : {}) })
      .where(eq(detectedEvents.id, id))
      .returning();
    return updated;
  }

  async deleteDetectedEvent(id: number): Promise<void> {
    const { eq } = await import("drizzle-orm");
    await db.delete(detectedEvents).where(eq(detectedEvents.id, id));
  }

  async getPendingEvents(): Promise<DetectedEvent[]> {
    const { eq, desc } = await import("drizzle-orm");
    return db
      .select()
      .from(detectedEvents)
      .where(eq(detectedEvents.status, "pending"))
      .orderBy(desc(detectedEvents.createdAt));
  }

  async getConfirmedEvents(): Promise<DetectedEvent[]> {
    const { eq, desc } = await import("drizzle-orm");
    return db
      .select()
      .from(detectedEvents)
      .where(eq(detectedEvents.status, "confirmed"))
      .orderBy(desc(detectedEvents.createdAt));
  }
}

export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private events: DetectedEvent[] = [];
  private nextEventId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { id: crypto.randomUUID(), ...insertUser };
    this.users.push(user);
    return user;
  }

  async getAllDetectedEvents(): Promise<DetectedEvent[]> {
    return [...this.events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDetectedEventById(id: number): Promise<DetectedEvent | undefined> {
    return this.events.find((e) => e.id === id);
  }

  async createDetectedEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const created: DetectedEvent = {
      id: this.nextEventId++,
      messageText: event.messageText,
      senderName: event.senderName ?? null,
      eventName: event.eventName,
      startTime: event.startTime instanceof Date ? event.startTime : new Date(event.startTime),
      duration: event.duration ?? 60,
      location: event.location ?? null,
      notes: event.notes ?? null,
      confidenceScore: event.confidenceScore,
      status: event.status ?? "pending",
      calendarEventId: event.calendarEventId ?? null,
      createdAt: new Date(),
    };
    this.events.push(created);
    return created;
  }

  async updateDetectedEventStatus(id: number, status: string, calendarEventId?: string): Promise<DetectedEvent> {
    const event = this.events.find((e) => e.id === id);
    if (!event) throw new Error("Event not found");
    event.status = status;
    if (calendarEventId) event.calendarEventId = calendarEventId;
    return event;
  }

  async deleteDetectedEvent(id: number): Promise<void> {
    this.events = this.events.filter((e) => e.id !== id);
  }

  async getPendingEvents(): Promise<DetectedEvent[]> {
    return this.events
      .filter((e) => e.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getConfirmedEvents(): Promise<DetectedEvent[]> {
    return this.events
      .filter((e) => e.status === "confirmed")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
