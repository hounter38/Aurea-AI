import type { Express, Request, Response } from "express";
import { extractEventsFromText, generateAiResponse, transcribeAudio } from "./aiEngine.js";
import { createCalendarEvent, getAuthUrl, getUpcomingEvents, handleCallback } from "./googleCalendar.js";
import type { IStorage } from "./storage.js";

const AUTO_CONFIRM_THRESHOLD = 0.9;

export function registerRoutes(router: Express, storage: IStorage) {
  // Health
  router.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "aurea",
      mode: process.env.OPENAI_API_KEY ? "live" : "demo",
      calendar: process.env.GOOGLE_ACCESS_TOKEN ? "connected" : "demo",
      database: process.env.DATABASE_URL ? "postgres" : "memory",
    });
  });

  // Stats
  router.get("/api/stats", async (_req: Request, res: Response) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // Events CRUD
  router.get("/api/events", async (_req: Request, res: Response) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  router.get("/api/events/:status", async (req: Request, res: Response) => {
    const events = await storage.getEventsByStatus(req.params.status);
    res.json(events);
  });

  router.patch("/api/events/:id/confirm", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const event = await storage.getEventById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const calResult = await createCalendarEvent(
      event.eventName,
      event.startTime,
      event.duration,
      event.notes || undefined,
      event.location || undefined
    );

    const updated = await storage.updateEventStatus(id, "confirmed", calResult.id);
    res.json({ event: updated, calendar: calResult });
  });

  router.patch("/api/events/:id/dismiss", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const updated = await storage.updateEventStatus(id, "dismissed");
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  });

  router.delete("/api/events/:id", async (req: Request, res: Response) => {
    await storage.deleteEvent(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // SMS Ingestion (from Android app / Tasker / manual)
  router.post("/api/sms/ingest", async (req: Request, res: Response) => {
    const { message, sender } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const extracted = await extractEventsFromText(message, sender);
    const created = [];

    for (const ev of extracted) {
      const record = await storage.createEvent({
        messageText: message,
        senderName: sender || null,
        eventName: ev.eventName,
        startTime: new Date(ev.startTime),
        duration: ev.duration,
        location: ev.location,
        notes: ev.notes,
        confidenceScore: ev.confidenceScore,
        status: ev.confidenceScore >= AUTO_CONFIRM_THRESHOLD ? "confirmed" : "pending",
      });

      if (ev.confidenceScore >= AUTO_CONFIRM_THRESHOLD) {
        const calResult = await createCalendarEvent(
          ev.eventName,
          new Date(ev.startTime),
          ev.duration,
          ev.notes || undefined,
          ev.location || undefined
        );
        await storage.updateEventStatus(record.id, "confirmed", calResult.id);
      }

      created.push(record);
    }

    res.json({
      processed: true,
      events_found: created.length,
      events: created,
      mode: process.env.OPENAI_API_KEY ? "live" : "demo",
    });
  });

  // AI Analysis (from Inbox page)
  router.post("/api/analyze", async (req: Request, res: Response) => {
    const { message, sender } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const extracted = await extractEventsFromText(message, sender);
    const aiResponse = await generateAiResponse(message);
    const created = [];

    for (const ev of extracted) {
      const record = await storage.createEvent({
        messageText: message,
        senderName: sender || null,
        eventName: ev.eventName,
        startTime: new Date(ev.startTime),
        duration: ev.duration,
        location: ev.location,
        notes: ev.notes,
        confidenceScore: ev.confidenceScore,
        status: ev.confidenceScore >= AUTO_CONFIRM_THRESHOLD ? "confirmed" : "pending",
      });

      if (ev.confidenceScore >= AUTO_CONFIRM_THRESHOLD) {
        const calResult = await createCalendarEvent(
          ev.eventName,
          new Date(ev.startTime),
          ev.duration,
          ev.notes || undefined,
          ev.location || undefined
        );
        await storage.updateEventStatus(record.id, "confirmed", calResult.id);
      }

      created.push(record);
    }

    res.json({
      response: aiResponse,
      events_found: created.length,
      events: created,
    });
  });

  // Voice Transcription
  router.post("/api/voice/transcribe", async (req: Request, res: Response) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", async () => {
      const audioBuffer = Buffer.concat(chunks);
      const transcript = await transcribeAudio(audioBuffer);
      res.json({ transcript });
    });
  });

  // Google Calendar
  router.get("/api/calendar/events", async (_req: Request, res: Response) => {
    const events = await getUpcomingEvents();
    res.json(events);
  });

  router.get("/api/auth/google", (_req: Request, res: Response) => {
    const url = getAuthUrl();
    if (!url) return res.status(503).json({ error: "Google OAuth not configured" });
    res.json({ url });
  });

  router.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    if (!code) return res.status(400).json({ error: "Missing code parameter" });
    try {
      const tokens = await handleCallback(code);
      res.json({ tokens, message: "Set GOOGLE_ACCESS_TOKEN and GOOGLE_REFRESH_TOKEN in .env" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ICS Export
  router.get("/api/events/:id/ics", async (req: Request, res: Response) => {
    const event = await storage.getEventById(parseInt(req.params.id));
    if (!event) return res.status(404).json({ error: "Event not found" });

    const start = event.startTime;
    const end = new Date(start.getTime() + event.duration * 60000);

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Aurea//Calendar//EN",
      "BEGIN:VEVENT",
      `DTSTART:${start.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTEND:${end.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `SUMMARY:${event.eventName}`,
      `DESCRIPTION:${event.notes || ""}`,
      `LOCATION:${event.location || ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    res.setHeader("Content-Type", "text/calendar");
    res.setHeader("Content-Disposition", `attachment; filename="${event.eventName}.ics"`);
    res.send(icsContent);
  });
}
