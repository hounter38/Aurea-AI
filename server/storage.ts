import { type User, type InsertUser, type DetectedEvent, type InsertDetectedEvent, users, detectedEvents } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

function getDb() {
  if (!db) throw new Error("Database not available");
  return db;
}

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
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await getDb().insert(users).values(insertUser).returning();
    return user;
  }

  async getAllDetectedEvents(): Promise<DetectedEvent[]> {
    return db.select().from(detectedEvents).orderBy(desc(detectedEvents.createdAt));
  }

  async getDetectedEventById(id: number): Promise<DetectedEvent | undefined> {
    const [event] = await getDb().select().from(detectedEvents).where(eq(detectedEvents.id, id));
    return event;
  }

  async createDetectedEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const [created] = await getDb().insert(detectedEvents).values(event).returning();
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
    await getDb().delete(detectedEvents).where(eq(detectedEvents.id, id));
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

class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private events: DetectedEvent[] = [];
  private nextId = 1;

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) { return Array.from(this.users.values()).find(u => u.username === username); }
  async createUser(user: InsertUser): Promise<User> {
    const created = { id: crypto.randomUUID(), ...user } as User;
    this.users.set(created.id, created);
    return created;
  }
  async getAllDetectedEvents() { return [...this.events].reverse(); }
  async getDetectedEventById(id: number) { return this.events.find(e => e.id === id); }
  async createDetectedEvent(event: InsertDetectedEvent): Promise<DetectedEvent> {
    const created: DetectedEvent = {
      id: this.nextId++,
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
    const event = this.events.find(e => e.id === id);
    if (!event) throw new Error("Not found");
    event.status = status;
    if (calendarEventId) event.calendarEventId = calendarEventId;
    return event;
  }
  async deleteDetectedEvent(id: number) { this.events = this.events.filter(e => e.id !== id); }
  async getPendingEvents() { return this.events.filter(e => e.status === "pending").reverse(); }
  async getConfirmedEvents() { return this.events.filter(e => e.status === "confirmed").reverse(); }
}

export const storage: IStorage = db ? new DatabaseStorage() : new MemoryStorage();
