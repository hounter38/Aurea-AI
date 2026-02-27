# 🌌 Aurea: The Anticipatory AI Assistant

**Stop managing your life. Start living it.** Aurea is a cross-platform AI assistant designed to eliminate the "mental load" of administrative life. It bridges the gap between your digital pings and your physical reality by turning messy messages into a flawless, organized schedule.

---

## ✨ Core Features

- **📡 Native SMS & Call Interception:** Unlike sandboxed apps, Aurea reads your incoming SMS and call logs to identify tasks in real-time.
- **📅 Autonomous Scheduling:** Automatically extracts deadlines, meeting times, and appointments from Gmail and texts, injecting them directly into your Google Calendar.
- **💊 Medication Intelligence:** Recognizes pharmacy alerts and dosage instructions, setting high-priority reminders that adjust to your daily schedule.
- **🧠 Anticipatory Logic:** Don't just mark a deadline; Aurea automatically carves out "Deep Work" blocks and "Prep Time" leading up to your events.
- **🔒 Privacy First:** On-device filtering ensures sensitive data is processed locally before intent extraction.

---

## 🛠️ Tech Stack

- **Mobile:** Kotlin (Native Android) for system-level SMS/Call access.
- **Intelligence:** Gemini 2.0 / OpenAI GPT-4o via Node.js Backend.
- **Frontend:** React / Tailwind CSS (Web Dashboard).
- **Integration:** Google Calendar API, Gmail API.
- **Environment:** Cursor IDE / Windsurf.

---

## 🚀 Quick Start

### 1. Prerequisites
- Android Studio (for Kotlin compilation).
- Node.js 20+.
- Google Cloud Console Project (with Calendar & Gmail APIs enabled).

### 2. Installation
```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/aurea.git](https://github.com/YOUR_USERNAME/aurea.git)

# Install Backend Dependencies
cd backend && npm install

# Install Frontend Dependencies
cd ../frontend && npm install
