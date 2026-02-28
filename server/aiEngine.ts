import OpenAI, { toFile } from "openai";

const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "demo";
const openai = new OpenAI({
  apiKey,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
});
const isDemo = apiKey === "demo";

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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isDemo) {
    return simulateIntent(messageText, senderName);
  }

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
  "event_name": "Short descriptive event name (e.g. 'Coffee at Starbucks')",
  "start_time": "ISO 8601 datetime (infer from context, use realistic times)",
  "duration": number (minutes, default 60),
  "location": "location or null",
  "notes": "any relevant notes or null",
  "confidence_score": number between 0 and 1
}

If no scheduling intent exists, return { "has_event": false } plus placeholder values for other fields.
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
  if (isDemo) return "Voice transcription requires OPENAI_API_KEY to be set.";
  const file = await toFile(audioBuffer, "audio.webm", { type: "audio/webm" });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
  });
  return transcription.text;
}

export async function generateVoiceResponse(
  userQuery: string,
  calendarEvents: any[]
): Promise<string> {
  if (isDemo) return "I analyzed your message and found potential calendar events. Check the Events tab for details.";
  const now = new Date();
  const eventsText =
    calendarEvents.length > 0
      ? calendarEvents
          .map((e) => {
            const start = e.start?.dateTime
              ? new Date(e.start.dateTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : e.start?.date || "All day";
            return `• ${e.summary || "Untitled"} at ${start}${e.location ? " — " + e.location : ""}`;
          })
          .join("\n")
      : "No events scheduled";

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are Aurea, a warm and intelligent AI calendar assistant. The current time is ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} on ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.

Today's calendar events:
${eventsText}

Respond naturally and concisely in 1-3 sentences. Be helpful and friendly. If asked about specific times, be precise.`,
      },
      {
        role: "user",
        content: userQuery,
      },
    ],
    max_completion_tokens: 200,
  });

  return response.choices[0]?.message?.content || "I couldn't retrieve your schedule right now.";
}

function simulateIntent(messageText: string, senderName?: string): ParsedEvent | null {
  const lower = messageText.toLowerCase();
  const now = new Date();

  if (lower.includes("appointment") || lower.includes("doctor") || lower.includes("dentist")) {
    const timeMatch = messageText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    const dateMatch = messageText.match(/(\w+ \d{1,2})/i);
    let dt = new Date(now.getTime() + 86400000 * 3);
    if (dateMatch) { const p = new Date(`${dateMatch[1]} ${now.getFullYear()}`); if (!isNaN(p.getTime())) dt = p; }
    if (timeMatch) { let h = parseInt(timeMatch[1]); const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0; if (timeMatch[3].toLowerCase() === "pm" && h < 12) h += 12; dt.setHours(h, m, 0, 0); }
    return { has_event: true, event_name: lower.includes("dentist") ? "Dentist Appointment" : "Doctor Appointment", start_time: dt.toISOString(), duration: 60, location: null, notes: `From ${senderName || "SMS"}`, confidence_score: 0.92 };
  }
  if (lower.includes("meeting") || lower.includes("zoom") || lower.includes("standup")) {
    const timeMatch = messageText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    let dt = new Date(now.getTime() + 86400000);
    if (timeMatch) { let h = parseInt(timeMatch[1]); const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0; if (timeMatch[3].toLowerCase() === "pm" && h < 12) h += 12; dt.setHours(h, m, 0, 0); }
    return { has_event: true, event_name: "Meeting", start_time: dt.toISOString(), duration: 30, location: null, notes: `From ${senderName || "SMS"}`, confidence_score: 0.85 };
  }
  if (lower.includes("dinner") || lower.includes("lunch")) {
    let dt = new Date(now.getTime() + 86400000); dt.setHours(lower.includes("lunch") ? 12 : 18, 0, 0, 0);
    return { has_event: true, event_name: lower.includes("dinner") ? "Dinner" : "Lunch", start_time: dt.toISOString(), duration: 90, location: null, notes: `From ${senderName || "SMS"}`, confidence_score: 0.82 };
  }
  if (lower.includes("medication") || lower.includes("pharmacy") || lower.includes("prescription")) {
    return { has_event: true, event_name: "Medication Reminder", start_time: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0).toISOString(), duration: 5, location: null, notes: `From ${senderName || "SMS"}`, confidence_score: 0.88 };
  }
  if (lower.includes("deadline") || lower.includes("due") || lower.includes("submit")) {
    return { has_event: true, event_name: "Deadline", start_time: new Date(now.getTime() + 86400000 * 2).toISOString(), duration: 60, location: null, notes: `From ${senderName || "SMS"}`, confidence_score: 0.80 };
  }
  return { has_event: true, event_name: `Reminder from ${senderName || "message"}`, start_time: new Date(now.getTime() + 86400000).toISOString(), duration: 30, location: null, notes: messageText.slice(0, 200), confidence_score: 0.5 };
}
