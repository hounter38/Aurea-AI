import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { analyzeMessageForIntent, transcribeAudio, generateVoiceResponse } from "./aiEngine";
import { createCalendarEvent, deleteCalendarEvent, getUpcomingEvents, getTodayEvents } from "./googleCalendar";
import { z } from "zod";
import { createEvent } from "ics";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  app.get("/sw.js", (_req, res) => {
    const swPath = process.env.NODE_ENV === "production"
      ? path.resolve(import.meta.dirname, "public", "sw.js")
      : path.resolve(import.meta.dirname, "..", "client", "public", "sw.js");
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(swPath);
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "Aurea", mode: "Replit Cloud" });
  });

  // --- Automated SMS Ingestion (for Tasker / automation apps) ---
  app.post("/api/sms/ingest", async (req, res) => {
    try {
      const { message, sender, timestamp } = req.body;
      const messageText = message || req.body.text || req.body.body || req.body.sms_body;
      const senderName = sender || req.body.from || req.body.sender_name || req.body.number || null;

      if (!messageText) {
        return res.status(400).json({ error: "No message text provided. Send as 'message', 'text', 'body', or 'sms_body' field." });
      }

      const parsed = await analyzeMessageForIntent(messageText, senderName);
      if (!parsed || !parsed.has_event) {
        return res.json({ processed: true, detected: false, message: "No scheduling intent found." });
      }

      const autoConfirm = parsed.confidence_score >= 0.9;

      const event = await storage.createDetectedEvent({
        messageText,
        senderName: senderName || null,
        eventName: parsed.event_name,
        startTime: new Date(parsed.start_time),
        duration: parsed.duration || 60,
        location: parsed.location || null,
        notes: parsed.notes || null,
        confidenceScore: parsed.confidence_score,
        status: autoConfirm ? "confirmed" : "pending",
        calendarEventId: null,
      });

      let autoSynced = false;
      if (autoConfirm) {
        try {
          const calendarEvent = await createCalendarEvent(
            parsed.event_name,
            new Date(parsed.start_time),
            parsed.duration || 60,
            parsed.location || null,
            parsed.notes || null
          );
          await storage.updateDetectedEventStatus(event.id, "confirmed", calendarEvent.id || undefined);
          autoSynced = true;
        } catch (err) {
          console.error("Auto-confirm calendar sync failed, reverting to pending:", err);
          await storage.updateDetectedEventStatus(event.id, "pending");
        }
      }

      return res.json({
        processed: true,
        detected: true,
        autoConfirmed: autoSynced,
        eventName: parsed.event_name,
        confidence: parsed.confidence_score,
      });
    } catch (err) {
      console.error("Error processing SMS:", err);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  // --- Message Analysis ---
  app.post("/api/analyze", async (req, res) => {
    try {
      const { messageText, senderName } = req.body;
      if (!messageText) return res.status(400).json({ error: "messageText is required" });

      const parsed = await analyzeMessageForIntent(messageText, senderName);
      if (!parsed) {
        return res.json({ detected: false, message: "No scheduling intent found." });
      }

      const autoConfirm = parsed.confidence_score >= 0.9;

      const event = await storage.createDetectedEvent({
        messageText,
        senderName: senderName || null,
        eventName: parsed.event_name,
        startTime: new Date(parsed.start_time),
        duration: parsed.duration || 60,
        location: parsed.location || null,
        notes: parsed.notes || null,
        confidenceScore: parsed.confidence_score,
        status: autoConfirm ? "confirmed" : "pending",
        calendarEventId: null,
      });

      let autoSynced = false;
      if (autoConfirm) {
        try {
          const calendarEvent = await createCalendarEvent(
            parsed.event_name,
            new Date(parsed.start_time),
            parsed.duration || 60,
            parsed.location || null,
            parsed.notes || null
          );
          await storage.updateDetectedEventStatus(event.id, "confirmed", calendarEvent.id || undefined);
          autoSynced = true;
        } catch (err) {
          console.error("Auto-confirm calendar sync failed, reverting to pending:", err);
          await storage.updateDetectedEventStatus(event.id, "pending");
        }
      }

      const updatedEvent = await storage.getDetectedEventById(event.id);
      return res.json({ detected: true, event: updatedEvent, autoConfirmed: autoSynced });
    } catch (err) {
      console.error("Error analyzing message:", err);
      res.status(500).json({ error: "Failed to analyze message" });
    }
  });

  // --- Events ---
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getAllDetectedEvents();
      res.json(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/pending", async (_req, res) => {
    try {
      const events = await storage.getPendingEvents();
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch pending events" });
    }
  });

  app.post("/api/events/:id/confirm", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getDetectedEventById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      const calendarEvent = await createCalendarEvent(
        event.eventName,
        new Date(event.startTime),
        event.duration,
        event.location,
        event.notes
      );

      const updated = await storage.updateDetectedEventStatus(id, "confirmed", calendarEvent.id || undefined);
      res.json(updated);
    } catch (err) {
      console.error("Error confirming event:", err);
      res.status(500).json({ error: "Failed to confirm event and sync to Google Calendar" });
    }
  });

  app.post("/api/events/confirm-all", async (req, res) => {
    try {
      const pending = await storage.getPendingEvents();
      if (pending.length === 0) return res.json({ confirmed: 0, results: [] });

      const results = [];
      for (const event of pending) {
        try {
          const calendarEvent = await createCalendarEvent(
            event.eventName,
            new Date(event.startTime),
            event.duration,
            event.location,
            event.notes
          );
          await storage.updateDetectedEventStatus(event.id, "confirmed", calendarEvent.id || undefined);
          results.push({ id: event.id, eventName: event.eventName, success: true });
        } catch (err) {
          console.error(`Failed to confirm event ${event.id}:`, err);
          results.push({ id: event.id, eventName: event.eventName, success: false });
        }
      }

      const confirmed = results.filter((r) => r.success).length;
      res.json({ confirmed, total: pending.length, results });
    } catch (err) {
      console.error("Error confirming all events:", err);
      res.status(500).json({ error: "Failed to confirm all events" });
    }
  });

  app.post("/api/events/:id/dismiss", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getDetectedEventById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      const updated = await storage.updateDetectedEventStatus(id, "dismissed");
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Failed to dismiss event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getDetectedEventById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      if (event.calendarEventId) {
        try {
          await deleteCalendarEvent(event.calendarEventId);
        } catch (err) {
          console.warn("Could not delete from Google Calendar:", err);
        }
      }

      await storage.deleteDetectedEvent(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.get("/api/events/:id/ics", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getDetectedEventById(id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      const start = new Date(event.startTime);
      const end = new Date(start.getTime() + event.duration * 60000);

      const icsEvent = {
        title: event.eventName,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes(),
        ] as [number, number, number, number, number],
        end: [
          end.getFullYear(),
          end.getMonth() + 1,
          end.getDate(),
          end.getHours(),
          end.getMinutes(),
        ] as [number, number, number, number, number],
        description: event.notes || `Detected by Aurea from: "${event.messageText}"`,
        location: event.location || undefined,
        status: "CONFIRMED" as const,
        organizer: event.senderName
          ? { name: event.senderName }
          : undefined,
      };

      const { error, value } = createEvent(icsEvent);
      if (error || !value) {
        console.error("ICS generation error:", error);
        return res.status(500).json({ error: "Failed to generate calendar file" });
      }

      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      const safeName = event.eventName.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "event";
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}.ics"`);
      res.send(value);
    } catch (err) {
      console.error("Error generating ICS:", err);
      res.status(500).json({ error: "Failed to generate calendar file" });
    }
  });

  // --- Google Calendar ---
  app.get("/api/calendar/upcoming", async (_req, res) => {
    try {
      const events = await getUpcomingEvents(20);
      res.json(events);
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/today", async (_req, res) => {
    try {
      const events = await getTodayEvents();
      res.json(events);
    } catch (err) {
      console.error("Error fetching today's events:", err);
      res.status(500).json({ error: "Failed to fetch today's events" });
    }
  });

  // --- Voice Query ---
  app.post("/api/voice/query", async (req, res) => {
    try {
      const { audio } = req.body;
      if (!audio) return res.status(400).json({ error: "audio (base64) is required" });

      const audioBuffer = Buffer.from(audio, "base64");
      const transcript = await transcribeAudio(audioBuffer);

      const todayEvents = await getTodayEvents();
      const aiResponse = await generateVoiceResponse(transcript, todayEvents);

      res.json({ transcript, response: aiResponse });
    } catch (err) {
      console.error("Error processing voice query:", err);
      res.status(500).json({ error: "Failed to process voice query" });
    }
  });

  // --- Stats ---
  app.get("/api/stats", async (_req, res) => {
    try {
      const allEvents = await storage.getAllDetectedEvents();
      const pending = allEvents.filter((e) => e.status === "pending").length;
      const confirmed = allEvents.filter((e) => e.status === "confirmed").length;
      const dismissed = allEvents.filter((e) => e.status === "dismissed").length;

      let todayCalendar = 0;
      try {
        const today = await getTodayEvents();
        todayCalendar = today.length;
      } catch (_) {}

      res.json({ total: allEvents.length, pending, confirmed, dismissed, todayCalendar });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
