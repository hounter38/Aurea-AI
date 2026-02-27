# Aurea — AI Calendar Autopilot

> "We remember so you don't have to"

## Architecture

| Component | Directory | Stack | Purpose |
|-----------|-----------|-------|---------|
| Backend API | `server/` | Node.js + TypeScript + Express | AI processing, Google Calendar API, event CRUD |
| Web Dashboard | `client/` | React 18 + Vite + wouter + shadcn/ui | Monitoring/admin (view events, confirm/dismiss) |
| Shared Types | `shared/` | Drizzle ORM + Zod | Database schema + TypeScript types |
| Android App | `android-app/` | Kotlin (Android Studio) | Native SMS/Call interception → auto-POST to backend |

### Core Pipeline (Fully Automatic)

```
SMS/Call arrives on phone
  → Android BroadcastReceiver fires instantly
  → WorkManager POSTs to /api/sms/ingest
  → Backend AI extracts events (OpenAI or demo simulation)
  → Events ≥90% confidence → auto-confirmed → Google Calendar
  → Events <90% confidence → pending review in dashboard
```

## Standard Commands

```bash
npm run dev          # Start full-stack dev server (Express + Vite on :5000)
npm run build        # Production build
npm run lint         # TypeScript type check
npm run db:push      # Push Drizzle schema to PostgreSQL
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health + mode info |
| POST | `/api/sms/ingest` | Ingest SMS from Android app (auto) |
| POST | `/api/analyze` | Analyze message from web dashboard (manual) |
| GET | `/api/events` | List all detected events |
| GET | `/api/events/:status` | Filter by status |
| PATCH | `/api/events/:id/confirm` | Confirm → push to Google Calendar |
| PATCH | `/api/events/:id/dismiss` | Dismiss event |
| GET | `/api/events/:id/ics` | Export .ics for Apple Calendar |
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/calendar/events` | Google Calendar upcoming events |
| POST | `/api/voice/transcribe` | Whisper transcription |

## Cursor Cloud specific instructions

- **Single dev command:** `npm run dev` starts Express + Vite on port 5000. No separate frontend server.
- **Database:** Falls back to in-memory storage when `DATABASE_URL` is not set. Fully functional for development.
- **AI mode:** Falls back to keyword-based simulation when `OPENAI_API_KEY` is not set. Tests pass in demo mode.
- **Calendar:** Falls back to simulated events when `GOOGLE_ACCESS_TOKEN` is not set.
- **Android app:** Cannot be compiled in this cloud environment (requires Android Studio + Android SDK). The Kotlin source files are ready to open in Android Studio on a local machine.
- **No watch mode needed:** `npm run dev` uses tsx which watches for changes. Vite provides HMR for the client.
- **Brand color:** `#C48B13` (amber/gold). Dark theme throughout. Use CSS variable `--primary` for the accent.
