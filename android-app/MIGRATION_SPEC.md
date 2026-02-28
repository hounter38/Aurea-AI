# Aurea — Complete Technical Specification for Migration

## 1. Architecture Overview

**Project Name:** Aurea — AI Calendar Autopilot
**Slogan:** "We remember so you don't have to"
**Brand Color:** #C48B13 (golden/amber)

### Technologies

| Layer | Technology | Details |
|-------|-----------|---------|
| Backend Runtime | Node.js + TypeScript | Express.js server |
| Frontend | React 18 + TypeScript | Vite bundler, SPA |
| Database | PostgreSQL | Drizzle ORM |
| AI | OpenAI API | gpt-5-mini (intent parsing), gpt-4o-mini-transcribe (voice) |
| Calendar | Google Calendar API v3 | OAuth2 via googleapis npm package |
| Styling | Tailwind CSS + shadcn/ui | Dark theme, amber accent |
| Routing | wouter | Client-side SPA routing |
| Data Fetching | @tanstack/react-query v5 | With default fetch-based queryFn |
| Forms | react-hook-form + zod | Via shadcn Form component |
| PWA | Custom service worker + manifest | Installable on mobile |
| ICS Export | ics npm package | Apple Calendar .ics file generation |

### Key NPM Packages

```
express, googleapis, openai, drizzle-orm, drizzle-zod, pg,
zod, ics, react, wouter, @tanstack/react-query,
tailwindcss, lucide-react, react-hook-form, @hookform/resolvers
```

---

## 2. Database Schema

### Table: `users`
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
```

### Table: `detected_events`
```sql
CREATE TABLE detected_events (
  id SERIAL PRIMARY KEY,
  message_text TEXT NOT NULL,
  sender_name TEXT,
  event_name TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  notes TEXT,
  confidence_score REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  calendar_event_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Drizzle Schema (shared/schema.ts)
```typescript
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

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export const insertDetectedEventSchema = createInsertSchema(detectedEvents).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DetectedEvent = typeof detectedEvents.$inferSelect;
export type InsertDetectedEvent = z.infer<typeof insertDetectedEventSchema>;
```

---

## 3. API Schema — All Endpoints

### POST /api/sms/ingest
**Purpose:** Automated SMS ingestion from Tasker, native Android app, or any automation tool.

**Request:**
```
POST /api/sms/ingest
Content-Type: application/json
```

**Body (flexible field names):**
```json
{
  "message": "Hey can we meet for lunch tomorrow at noon at Chipotle?",
  "sender": "Mom"
}
```
Accepted aliases: `message` / `text` / `body` / `sms_body` for the text; `sender` / `from` / `sender_name` / `number` for the sender.

**Response (event detected, auto-confirmed):**
```json
{
  "processed": true,
  "detected": true,
  "autoConfirmed": true,
  "eventName": "Lunch with Mom",
  "confidence": 0.98
}
```

**Response (no scheduling intent):**
```json
{
  "processed": true,
  "detected": false,
  "message": "No scheduling intent found."
}
```

---

### POST /api/analyze
**Purpose:** Manual message analysis from the web UI.

**Request:**
```json
{
  "messageText": "Let's grab coffee Friday at 3pm",
  "senderName": "Jake"
}
```

**Response:**
```json
{
  "detected": true,
  "event": {
    "id": 5,
    "messageText": "Let's grab coffee Friday at 3pm",
    "senderName": "Jake",
    "eventName": "Coffee",
    "startTime": "2026-02-28T15:00:00.000Z",
    "duration": 60,
    "location": null,
    "notes": "...",
    "confidenceScore": 0.95,
    "status": "confirmed",
    "calendarEventId": "abc123",
    "createdAt": "2026-02-27T10:00:00.000Z"
  },
  "autoConfirmed": true
}
```

---

### GET /api/events
Returns all detected events, ordered by `created_at DESC`.

**Response:** Array of `DetectedEvent` objects.

---

### GET /api/events/pending
Returns only events with `status = "pending"`.

---

### POST /api/events/:id/confirm
Confirms a pending event and syncs it to Google Calendar.

**Response:** Updated `DetectedEvent` with `status: "confirmed"` and `calendarEventId`.

---

### POST /api/events/confirm-all
Batch confirms all pending events to Google Calendar.

**Response:**
```json
{
  "confirmed": 3,
  "total": 4,
  "results": [
    { "id": 1, "eventName": "Coffee", "success": true },
    { "id": 2, "eventName": "Lunch", "success": true },
    { "id": 3, "eventName": "Meeting", "success": true },
    { "id": 4, "eventName": "Call", "success": false }
  ]
}
```

---

### POST /api/events/:id/dismiss
Sets event status to `"dismissed"`.

---

### DELETE /api/events/:id
Deletes event from database AND from Google Calendar if it was synced.

---

### GET /api/events/:id/ics
Downloads a `.ics` file for Apple Calendar / iCloud Calendar.

**Response:** `Content-Type: text/calendar` with `.ics` file attachment.

---

### GET /api/calendar/upcoming
Returns next 20 events from Google Calendar.

---

### GET /api/calendar/today
Returns today's events from Google Calendar.

---

### POST /api/voice/query
**Request:**
```json
{
  "audio": "<base64-encoded-webm-audio>"
}
```

**Response:**
```json
{
  "transcript": "What do I have this afternoon?",
  "response": "You have Coffee at Starbucks at 3 PM and a team meeting at 5 PM."
}
```

---

### GET /api/stats
**Response:**
```json
{
  "total": 12,
  "pending": 3,
  "confirmed": 8,
  "dismissed": 1,
  "todayCalendar": 2
}
```

---

## 4. Environment Variables

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key for AI analysis |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL (Replit proxy or `https://api.openai.com/v1`) |
| `SESSION_SECRET` | Express session secret |
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `REPLIT_CONNECTORS_HOSTNAME` | Replit-specific: Google Calendar OAuth connector hostname |
| `REPL_IDENTITY` | Replit-specific: auth token for connectors |

**Note for migration:** The Google Calendar integration uses Replit's connector system for OAuth. When migrating, you'll need to replace this with standard Google OAuth2 (client ID + client secret + refresh token). The `googleapis` npm package supports this natively.

---

## 5. Core Logic — AI Engine (server/aiEngine.ts)

```typescript
import OpenAI, { toFile } from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ParsedEvent {
  has_event: boolean;
  event_name: string;
  start_time: string;
  duration: number;
  location: string | null;
  notes: string | null;
  confidence_score: number;
}

export async function analyzeMessageForIntent(
  messageText: string,
  senderName?: string
): Promise<ParsedEvent | null> {
  const now = new Date();
  const today = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are Aurea, an AI that detects scheduling intent in messages. Today is ${today} (${now.toISOString()}).

Analyze the message and detect if it contains scheduling intent (meeting, call, appointment, lunch, coffee, event, etc.).

Return a JSON object with:
{
  "has_event": boolean,
  "event_name": "Short descriptive event name",
  "start_time": "ISO 8601 datetime",
  "duration": number (minutes, default 60),
  "location": "location or null",
  "notes": "relevant notes or null",
  "confidence_score": number between 0 and 1
}

If no scheduling intent, return { "has_event": false } plus placeholder values.
Always return valid JSON.`,
      },
      {
        role: "user",
        content: `Message from ${senderName || "Someone"}: "${messageText}"`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return null;
  const parsed = JSON.parse(content) as ParsedEvent;
  if (!parsed.has_event) return null;
  return parsed;
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = await toFile(audioBuffer, "audio.webm", { type: "audio/webm" });
  const transcription = await openai.audio.transcriptions.create({
    file, model: "gpt-4o-mini-transcribe",
  });
  return transcription.text;
}

export async function generateVoiceResponse(
  userQuery: string,
  calendarEvents: any[]
): Promise<string> {
  const now = new Date();
  const eventsText = calendarEvents.length > 0
    ? calendarEvents.map((e) => {
        const start = e.start?.dateTime
          ? new Date(e.start.dateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
          : e.start?.date || "All day";
        return `• ${e.summary || "Untitled"} at ${start}${e.location ? " — " + e.location : ""}`;
      }).join("\n")
    : "No events scheduled";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are Aurea, a warm and intelligent AI calendar assistant. Current time: ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} on ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.

Today's calendar events:
${eventsText}

Respond naturally in 1-3 sentences. Be helpful and friendly.`,
      },
      { role: "user", content: userQuery },
    ],
    max_completion_tokens: 200,
  });

  return response.choices[0]?.message?.content || "I couldn't retrieve your schedule right now.";
}
```

---

## 6. Core Logic — Google Calendar (server/googleCalendar.ts)

**Replit version** uses Replit connectors for OAuth. For migration, replace with standard Google OAuth2:

```typescript
import { google } from "googleapis";

// FOR MIGRATION: Replace with standard OAuth2
// const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export async function createCalendarEvent(
  eventName: string,
  startTime: Date,
  durationMinutes: number,
  location?: string | null,
  notes?: string | null
) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: eventName,
      location: location ?? undefined,
      description: notes ?? undefined,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    },
  });
  return response.data;
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  await calendar.events.delete({ calendarId: "primary", eventId });
}

export async function getUpcomingEvents(maxResults = 20) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });
  return response.data.items || [];
}

export async function getTodayEvents() {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  return response.data.items || [];
}
```

---

## 7. Auto-Confirm Logic

When AI confidence >= 0.90:
1. Event is created in DB with `status: "confirmed"`
2. Calendar event is created via Google Calendar API
3. If calendar sync fails, status reverts to `"pending"` for manual review

When AI confidence < 0.90:
1. Event is created with `status: "pending"`
2. User must manually confirm from the Events Queue

---

## 8. Frontend Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Dashboard | Stats overview + pending events + upcoming calendar |
| `/inbox` | Inbox | Paste message for AI analysis |
| `/events` | Events | Events queue with tabs (pending/confirmed/dismissed) |
| `/voice` | Voice | Record voice → transcribe → AI response |
| `/calendar` | Calendar | Upcoming Google Calendar events grouped by day |
| `/setup` | Setup | Automation setup guide (Tasker instructions, API endpoint) |

---

## 9. Full File Tree

```
client/
  index.html
  public/
    manifest.json
    sw.js
    favicon.png
    icon-192.png, icon-384.png, icon-512.png
    apple-touch-icon.png
  src/
    main.tsx
    index.css
    App.tsx
    lib/
      queryClient.ts
      utils.ts
    hooks/
      use-toast.ts
      use-mobile.tsx
    pages/
      dashboard.tsx
      inbox.tsx
      events.tsx
      voice.tsx
      calendar.tsx
      setup.tsx
      not-found.tsx
    components/
      app-sidebar.tsx
      mobile-nav.tsx
      install-prompt.tsx
      ui/  (shadcn components — button, card, badge, tabs, form, etc.)

server/
  index.ts          — Express app setup, middleware, workflow bootstrap
  routes.ts         — All API route handlers
  aiEngine.ts       — OpenAI integration (intent, transcription, responses)
  googleCalendar.ts — Google Calendar CRUD
  storage.ts        — Database storage layer (IStorage interface + implementation)
  db.ts             — PostgreSQL connection via Drizzle
  static.ts         — Production static file serving
  vite.ts           — Dev server Vite middleware

shared/
  schema.ts         — Drizzle schema + Zod insert schemas + TypeScript types

android-app/       — Native Android companion (Kotlin)
  (see android-app/README.md for structure)
```

---

## 10. Migration Notes for Cursor

1. **Google Calendar OAuth**: Replace Replit connector with standard `googleapis` OAuth2 flow. You'll need a Google Cloud project with Calendar API enabled, OAuth consent screen, and client credentials.

2. **OpenAI**: Replace `AI_INTEGRATIONS_OPENAI_BASE_URL` with `https://api.openai.com/v1` and use your own OpenAI API key.

3. **Database**: Set up a PostgreSQL instance (Supabase, Railway, Neon, or local). Run schema via Drizzle push.

4. **Native Android SMS**: The `android-app/` folder contains a complete Kotlin project that reads SMS and creates calendar events locally. To make it POST to your backend instead, modify `SmsReceiver.kt` and `ScanWorker.kt` to call `/api/sms/ingest` with the message body.

5. **PWA**: The `manifest.json` and `sw.js` are already configured. Update the `start_url` and icons to match your new domain.
