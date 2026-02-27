# Aurea AI Assistant – Developer Guide

## Project Overview

Aurea intercepts SMS, phone calls, and emails on Android/iOS, sends them to an LLM for event extraction, and pushes the results to Google Calendar. The project has three components:

| Service | Directory | Port | Stack |
|---------|-----------|------|-------|
| Backend API | `backend/` | 4000 | Node.js / Express |
| Web Dashboard | `frontend/` | 3000 | React / Tailwind CSS (CRA) |
| Mobile App | `mobile/` | 8081 (Expo) | React Native / Expo |

### Core Pipeline

```
SMS/Call/Email (mobile) ──► Backend API ──► LLM (OpenAI GPT-4o) ──► Google Calendar API
```

The backend runs in **demo mode** (keyword-based simulation) when `OPENAI_API_KEY` is not set, and **live mode** with real LLM processing when it is.

## Standard Commands

| Action | Backend | Frontend | Mobile |
|--------|---------|----------|--------|
| Install | `npm install` | `npm install` | `npm install` |
| Dev server | `npm run dev` | `npm start` | `npx expo start` |
| Tests | `npm test` | `npx react-scripts test --watchAll=false` | `npm test` |
| Lint | `npm run lint` | built-in (react-app eslint) | `npm run lint` |
| Build | — | `npm run build` | `npx expo export` |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check + mode info |
| POST | `/api/messages/sms` | Ingest SMS from mobile |
| POST | `/api/messages/call` | Ingest call transcript from mobile |
| POST | `/api/messages/email` | Ingest email |
| GET | `/api/messages` | List all ingested messages |
| POST | `/api/process/:messageId` | Process a specific message through LLM → Calendar |
| POST | `/api/process-inline` | Ingest + process in one step (used by dashboard) |
| GET | `/api/events` | List all created calendar events |

## Cursor Cloud specific instructions

- **Node.js version:** The environment ships with Node.js 22. No version manager needed.
- **Starting services:** Start backend first (`cd backend && npm run dev`), then frontend (`cd frontend && BROWSER=none npm start`). The frontend fetches from `http://localhost:4000` by default (configurable via `REACT_APP_API_URL`).
- **`BROWSER=none`:** Always pass this when starting the frontend in headless/cloud environments.
- **Frontend tests:** Use `npx react-scripts test --watchAll=false` to run non-interactively. Default `npm test` enters watch mode.
- **Backend hot reload:** Uses `node --watch`. Restart manually after installing new npm packages.
- **Demo mode:** Everything works without API keys. The LLM service falls back to keyword-based extraction, and Google Calendar falls back to simulated event creation. Set `OPENAI_API_KEY` for live LLM processing; set `GOOGLE_ACCESS_TOKEN` for real Calendar integration.
- **Mobile app:** The Expo mobile app cannot run in this cloud environment (requires Android emulator / iOS simulator). The mobile code can be linted and the Expo config validated, but device testing requires a local machine with Android Studio or Xcode.
- **API testing shortcut:** Use `POST /api/process-inline` with `{"body": "...", "source": "sms", "sender": "..."}` to test the full pipeline from the terminal via curl.
