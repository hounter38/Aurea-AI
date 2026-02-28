# Aurea — AI Calendar Autopilot

## Overview

Aurea is an AI-driven "Invisible Assistant" that sits between a user's communications and their Google Calendar. It uses natural language processing to detect scheduling intent and automatically syncs events, achieving a "Zero-Input" user experience.

## Architecture

**Stack:** TypeScript, React, Express.js, PostgreSQL (Drizzle ORM), OpenAI AI Integrations, Google Calendar API

**Design Philosophy:** Fibonacci Harmony — a balance between Total Privacy (user control) and Total Automation (AI efficiency). The "Golden Mean" is: Aurea only interrupts users to confirm an event.

## Features

1. **AI Message Analysis** — Paste any message; GPT-5-mini detects scheduling intent and extracts event details with a confidence score
2. **Events Queue** — Review, confirm, or dismiss AI-detected events; one tap syncs to Google Calendar or Apple Calendar
3. **Google Calendar Sync** — OAuth-connected; confirmed events are automatically created in the user's primary calendar
4. **Apple Calendar Support** — Download .ics files for any event to add to Apple Calendar / iCloud Calendar
5. **Batch Confirm** — "Confirm All" button to sync all pending events to Google Calendar at once
6. **Voice Assistant** — Record voice queries like "What's my afternoon?" — Aurea transcribes via Whisper, reads your live calendar, and replies
7. **Calendar View** — Upcoming events from Google Calendar grouped by day
8. **Dashboard** — Stats overview + pending events + upcoming calendar

## File Structure

```
client/
  public/
    manifest.json       - PWA manifest (Google Play / installable)
    sw.js               - Service worker (offline support, caching)
    icon-192.png        - PWA icon 192x192
    icon-384.png        - PWA icon 384x384
    icon-512.png        - PWA icon 512x512
    apple-touch-icon.png - Apple touch icon 180x180
  src/
    pages/
      dashboard.tsx     - Overview with stats + pending events + upcoming calendar
      inbox.tsx         - Message analysis (paste message → AI intent detection)
      events.tsx        - Events queue with tabs (pending/confirmed/dismissed)
      voice.tsx         - Voice assistant (record → transcribe → AI response)
      calendar.tsx      - Google Calendar upcoming events view
    components/
      app-sidebar.tsx   - Navigation sidebar with pending badge
      mobile-nav.tsx    - Mobile bottom tab bar
      install-prompt.tsx - PWA install prompt banner

server/
  googleCalendar.ts   - Google Calendar API client (OAuth via Replit connector)
  aiEngine.ts         - OpenAI integration (intent parsing, transcription, responses)
  storage.ts          - Database storage layer (PostgreSQL via Drizzle)
  routes.ts           - All API routes
  db.ts               - Database connection

shared/
  schema.ts           - Drizzle schema: users, detectedEvents tables
```

## Automation (SMS Ingestion)

- **Endpoint**: `POST /api/sms/ingest` — accepts JSON body with `message` and `sender` fields
- **Tasker/MacroDroid/Automate** can forward incoming SMS to this endpoint automatically
- Accepts flexible field names: `message`/`text`/`body`/`sms_body` for the text, `sender`/`from`/`number` for the sender
- Messages with scheduling intent are auto-confirmed (>= 90% confidence) or queued as pending
- Non-scheduling messages are silently discarded (no event created)
- Setup guide available at `/setup` page in the app

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/sms/ingest` | POST | Automated SMS ingestion (for Tasker/automation apps) |
| `/api/analyze` | POST | Analyze message text for scheduling intent |
| `/api/events` | GET | All detected events |
| `/api/events/:id/confirm` | POST | Confirm event → sync to Google Calendar |
| `/api/events/:id/dismiss` | POST | Dismiss event |
| `/api/events/:id` | DELETE | Delete event (and from Google Calendar if synced) |
| `/api/events/:id/ics` | GET | Download .ics file for Apple Calendar |
| `/api/events/confirm-all` | POST | Batch confirm all pending events to Google Calendar |
| `/api/calendar/upcoming` | GET | Upcoming events from Google Calendar |
| `/api/calendar/today` | GET | Today's events from Google Calendar |
| `/api/voice/query` | POST | Voice query (base64 audio → transcribe → AI response) |
| `/api/stats` | GET | Stats: pending/confirmed/dismissed counts |

## Integrations

- **OpenAI (Replit AI Integrations)** — No user API key required; billed to Replit credits
  - `gpt-5-mini` for intent parsing and schedule summaries
  - `gpt-4o-mini-transcribe` for voice transcription
- **Google Calendar** — OAuth via Replit connector (full calendar read/write access)
- **PostgreSQL** — Managed database via Replit

## Mobile Responsive

- **Mobile bottom nav** (`MobileNav`): fixed bottom tab bar with 5 icons, visible below `md` breakpoint
- **Desktop sidebar** (`AppSidebar`): visible on `md+`, hidden on mobile; sidebar trigger hidden on mobile
- **All pages**: `p-4 md:p-6` responsive padding; text sizes scale (`text-xl md:text-2xl` for headings)
- **Dashboard stats**: `grid-cols-2 sm:grid-cols-4` responsive grid
- **Safe areas**: iOS notch handling via `env(safe-area-inset-top)` on header, `env(safe-area-inset-bottom)` on bottom nav
- **SEO**: title, meta description, OG tags, theme-color meta tag

## PWA (Progressive Web App)

- **Manifest**: `client/public/manifest.json` — installable as standalone app on Android/Chrome
- **Service worker**: `client/public/sw.js` — network-first caching, offline fallback to cached shell
- **Install prompt**: Shows on compatible browsers (Chrome/Edge) with "Install Aurea" banner
- **Icons**: 192px, 384px, 512px maskable icons + Apple Touch Icon
- **Google Play**: Can be wrapped as TWA (Trusted Web Activity) using Bubblewrap CLI after deploying to HTTPS

## Auto-Confirm

- Events with AI confidence >= 90% are automatically synced to Google Calendar on detection
- If calendar sync fails, the event reverts to "pending" for manual confirmation
- UI shows "Auto-Synced to Calendar" title for auto-confirmed events
- Lower confidence events still require manual approval (data conservation)

## Theme

Golden/amber brand (`#C48B13` primary) — reflecting "Aurea" (Latin for Golden), the Golden Ratio philosophy.
