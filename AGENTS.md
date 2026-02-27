# Aurea AI Assistant – Developer Guide

## Project Overview

Aurea is an Anticipatory AI Assistant with two primary services:

| Service | Directory | Port | Stack |
|---------|-----------|------|-------|
| Backend | `backend/` | 4000 | Node.js / Express |
| Frontend | `frontend/` | 3000 | React / Tailwind CSS (CRA) |

## Standard Commands

| Action | Backend | Frontend |
|--------|---------|----------|
| Install | `npm install` (in `backend/`) | `npm install` (in `frontend/`) |
| Dev server | `npm run dev` | `npm start` |
| Tests | `npm test` | `npx react-scripts test --watchAll=false` |
| Lint | `npm run lint` | built-in via `react-app` ESLint config |
| Build | — | `npm run build` |

## Cursor Cloud specific instructions

- **Node.js version:** The environment ships with Node.js 22 (via system install). No version manager setup is needed.
- **Starting services:** Start the backend first (`cd backend && npm run dev`), then the frontend (`cd frontend && BROWSER=none npm start`). The frontend fetches from the backend at `http://localhost:4000` by default (configurable via `REACT_APP_API_URL`).
- **`BROWSER=none`:** Always pass `BROWSER=none` when starting the frontend dev server in headless/cloud environments to prevent CRA from trying to open a browser.
- **Frontend tests:** Use `npx react-scripts test --watchAll=false` to run tests non-interactively. The default `npm test` enters watch mode which blocks the terminal.
- **Backend hot reload:** The backend dev server uses `node --watch`, which watches `src/` for changes. If you install a new npm dependency, you need to restart the dev server manually.
- **No external services required:** The current scaffold runs entirely locally with no database, Redis, or external API keys needed. Future integrations (Google Calendar API, Gmail API, OpenAI/Gemini) will require API keys configured in `backend/.env` (see `backend/.env.example`).
