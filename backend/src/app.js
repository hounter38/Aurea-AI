const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const uuidv4 = () => crypto.randomUUID();
const { extractEvents } = require("./services/llm");
const { createCalendarEvent } = require("./services/calendar");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const messages = [];
const processedEvents = [];

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "aurea-backend",
    mode: process.env.OPENAI_API_KEY ? "live" : "demo",
    google_calendar: process.env.GOOGLE_ACCESS_TOKEN ? "connected" : "demo",
  });
});

// --- Message Ingestion (from mobile apps) ---

app.post("/api/messages/sms", (req, res) => {
  const { sender, body, timestamp, device_platform } = req.body;
  if (!body) return res.status(400).json({ error: "body is required" });

  const msg = {
    id: uuidv4(),
    source: "sms",
    sender: sender || "Unknown",
    body,
    timestamp: timestamp || new Date().toISOString(),
    device_platform: device_platform || "unknown",
    status: "received",
    created_at: new Date().toISOString(),
  };
  messages.push(msg);
  res.status(201).json({ message: msg });
});

app.post("/api/messages/call", (req, res) => {
  const { caller, transcript, duration_seconds, timestamp, device_platform } =
    req.body;
  if (!transcript)
    return res.status(400).json({ error: "transcript is required" });

  const msg = {
    id: uuidv4(),
    source: "call",
    sender: caller || "Unknown",
    body: transcript,
    duration_seconds: duration_seconds || 0,
    timestamp: timestamp || new Date().toISOString(),
    device_platform: device_platform || "unknown",
    status: "received",
    created_at: new Date().toISOString(),
  };
  messages.push(msg);
  res.status(201).json({ message: msg });
});

app.post("/api/messages/email", (req, res) => {
  const { sender, subject, body, timestamp } = req.body;
  if (!body) return res.status(400).json({ error: "body is required" });

  const msg = {
    id: uuidv4(),
    source: "email",
    sender: sender || "Unknown",
    subject: subject || "(no subject)",
    body,
    timestamp: timestamp || new Date().toISOString(),
    status: "received",
    created_at: new Date().toISOString(),
  };
  messages.push(msg);
  res.status(201).json({ message: msg });
});

app.get("/api/messages", (_req, res) => {
  res.json({ messages: messages.slice().reverse() });
});

// --- LLM Processing Pipeline ---

app.post("/api/process/:messageId", async (req, res) => {
  const msg = messages.find((m) => m.id === req.params.messageId);
  if (!msg) return res.status(404).json({ error: "message not found" });

  try {
    msg.status = "processing";
    const apiKey = process.env.OPENAI_API_KEY || null;
    const extracted = await extractEvents(msg.body, msg.source, apiKey);
    msg.status = "processed";
    msg.extracted_events = extracted;

    const calendarResults = [];
    const credentials = process.env.GOOGLE_ACCESS_TOKEN
      ? { access_token: process.env.GOOGLE_ACCESS_TOKEN }
      : null;

    for (const event of extracted) {
      const calResult = await createCalendarEvent(event, credentials);
      const record = {
        id: uuidv4(),
        message_id: msg.id,
        source: msg.source,
        sender: msg.sender,
        ...event,
        calendar: calResult,
        created_at: new Date().toISOString(),
      };
      processedEvents.push(record);
      calendarResults.push(record);
    }

    res.json({
      message_id: msg.id,
      status: "processed",
      events_created: calendarResults.length,
      events: calendarResults,
      mode: apiKey ? "live_llm" : "demo_simulation",
    });
  } catch (err) {
    msg.status = "error";
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/process-inline", async (req, res) => {
  const { body, source, sender } = req.body;
  if (!body) return res.status(400).json({ error: "body is required" });

  const msg = {
    id: uuidv4(),
    source: source || "manual",
    sender: sender || "Dashboard",
    body,
    timestamp: new Date().toISOString(),
    status: "received",
    created_at: new Date().toISOString(),
  };
  messages.push(msg);

  try {
    msg.status = "processing";
    const apiKey = process.env.OPENAI_API_KEY || null;
    const extracted = await extractEvents(msg.body, msg.source, apiKey);
    msg.status = "processed";
    msg.extracted_events = extracted;

    const calendarResults = [];
    const credentials = process.env.GOOGLE_ACCESS_TOKEN
      ? { access_token: process.env.GOOGLE_ACCESS_TOKEN }
      : null;

    for (const event of extracted) {
      const calResult = await createCalendarEvent(event, credentials);
      const record = {
        id: uuidv4(),
        message_id: msg.id,
        source: msg.source,
        sender: msg.sender,
        ...event,
        calendar: calResult,
        created_at: new Date().toISOString(),
      };
      processedEvents.push(record);
      calendarResults.push(record);
    }

    res.json({
      message_id: msg.id,
      status: "processed",
      events_created: calendarResults.length,
      events: calendarResults,
      mode: apiKey ? "live_llm" : "demo_simulation",
    });
  } catch (err) {
    msg.status = "error";
    res.status(500).json({ error: err.message });
  }
});

// --- Calendar Events ---

app.get("/api/events", (_req, res) => {
  res.json({ events: processedEvents.slice().reverse() });
});

module.exports = app;
