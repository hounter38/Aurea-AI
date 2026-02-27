import { eq, desc } from "drizzle-orm";
import { db } from "./db.js";
import { detectedEvents, users } from "../shared/schema.js";
import type { DetectedEvent, InsertDetectedEvent, User, InsertUser } from "../shared/schema.js";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getEvents(): Promise<DetectedEvent[]>;
  getEventById(id: number): Promise<DetectedEvent | undefined>;
  getEventsByStatus(status: string): Promise<DetectedEvent[]>;
  createEvent(event: InsertDetectedEvent): Promise<DetectedEvent>;
  updateEventStatus(id: number, status: string, calendarEventId?: string): Promise<DetectedEvent | undefined>;
  deleteEvent(id: number): Promise<void>;
  getStats(): Promise<{ total: number; pending: number; confirmed: number; dismissed: number }>;
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

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getEvents(): Promise<DetectedEvent[]> {
    return db.select().from(detectedEvents).orderBy(desc(detectedEvents.createdAt));
  }

  async getEventById(id: number): Promise<DetectedEvent | undefined> {
    const [event] = await db.select().from(detectedEvents).where(eq(detectedEvents.id, id));
    return event;
  }

  async getEventsByStatus(status: string): Promise<DetectedEvent[]> {
    return db.select().from(detectedEvents).where(eq(detectedEvents.status, status)).orderBy(desc(detectedEvents.createdAt));
  }

  async createEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const [created] = await db.insert(detectedEvents).values(event).returning();
    return created;
  }

  async updateEventStatus(id: number, status: string, calendarEventId?: string): Promise<DetectedEvent | undefined> {
    const values: Record<string, unknown> = { status };
    if (calendarEventId) values.calendarEventId = calendarEventId;
    const [updated] = await db.update(detectedEvents).set(values).where(eq(detectedEvents.id, id)).returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(detectedEvents).where(eq(detectedEvents.id, id));
  }

  async getStats() {
    const all = await db.select().from(detectedEvents);
    return {
      total: all.length,
      pending: all.filter((e) => e.status === "pending").length,
      confirmed: all.filter((e) => e.status === "confirmed").length,
      dismissed: all.filter((e) => e.status === "dismissed").length,
    };
  }
}

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private events: DetectedEvent[] = [];
  private nextEventId = 1;

  async getUser(id: string) {
    return this.users.get(id);
  }

  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    const created: User = { id, ...user };
    this.users.set(id, created);
    return created;
  }

  async getEvents() {
    return [...this.events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getEventById(id: number) {
    return this.events.find((e) => e.id === id);
  }

  async getEventsByStatus(status: string) {
    return this.events.filter((e) => e.status === status).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const created: DetectedEvent = {
      id: this.nextEventId++,
      messageText: event.messageText,
      senderName: event.senderName ?? null,
      eventName: event.eventName,
      startTime: event.startTime,
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

  async updateEventStatus(id: number, status: string, calendarEventId?: string) {
    const event = this.events.find((e) => e.id === id);
    if (!event) return undefined;
    event.status = status;
    if (calendarEventId) event.calendarEventId = calendarEventId;
    return event;
  }

  async deleteEvent(id: number) {
    this.events = this.events.filter((e) => e.id !== id);
  }

  async getStats() {
    return {
      total: this.events.length,
      pending: this.events.filter((e) => e.status === "pending").length,
      confirmed: this.events.filter((e) => e.status === "confirmed").length,
      dismissed: this.events.filter((e) => e.status === "dismissed").length,
    };
  }
}
