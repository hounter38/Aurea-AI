import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ExtractedEvent {
  eventName: string;
  startTime: string;
  duration: number;
  location: string | null;
  notes: string | null;
  confidenceScore: number;
}

const SYSTEM_PROMPT = `You are Aurea, an AI assistant that extracts calendar-worthy events from text messages, call transcripts, and emails.

Given a raw message, extract ALL actionable calendar events and return them as a JSON array.

Each item must have:
- "eventName": short descriptive event title
- "startTime": ISO 8601 datetime string (use current year if not specified, infer reasonable times)
- "duration": duration in minutes (default 60)
- "location": location if mentioned, otherwise null
- "notes": any relevant context from the message
- "confidenceScore": 0.0-1.0 how confident you are this is a real event

If the message contains no actionable events, return an empty array.
Return ONLY valid JSON, no markdown fences or explanation.`;

export async function extractEventsFromText(
  messageText: string,
  senderName?: string
): Promise<ExtractedEvent[]> {
  if (!openai) {
    return simulateExtraction(messageText, senderName);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Sender: ${senderName || "Unknown"}\nMessage: ${messageText}\nToday: ${new Date().toISOString().split("T")[0]}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const raw = response.choices[0].message.content?.trim() || "[]";
    return JSON.parse(raw);
  } catch (err) {
    console.error("OpenAI extraction failed, falling back to simulation:", err);
    return simulateExtraction(messageText, senderName);
  }
}

export async function generateAiResponse(messageText: string): Promise<string> {
  if (!openai) {
    return `I analyzed your message and found potential calendar events. Check the Events tab for details.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Aurea, a helpful AI calendar assistant. Summarize what events you found in the message and what actions you took. Be concise and friendly.",
        },
        { role: "user", content: messageText },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });
    return response.choices[0].message.content || "Message processed.";
  } catch {
    return "Message processed. Check events tab for extracted calendar items.";
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  if (!openai) {
    return "Voice transcription requires an OpenAI API key. Set OPENAI_API_KEY in your environment.";
  }

  const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });
  return response.text;
}

function simulateExtraction(messageText: string, senderName?: string): ExtractedEvent[] {
  const lower = messageText.toLowerCase();
  const events: ExtractedEvent[] = [];
  const now = new Date();

  if (lower.includes("appointment") || lower.includes("doctor") || lower.includes("dentist")) {
    const dateMatch = messageText.match(/(\w+ \d{1,2})/i);
    const timeMatch = messageText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    let dt = new Date(now.getTime() + 86400000 * 3);
    if (dateMatch) {
      const parsed = new Date(`${dateMatch[1]} ${now.getFullYear()}`);
      if (!isNaN(parsed.getTime())) dt = parsed;
    }
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3].toLowerCase() === "pm" && h < 12) h += 12;
      dt.setHours(h, m, 0, 0);
    }
    events.push({
      eventName: lower.includes("dentist") ? "Dentist Appointment" : "Doctor Appointment",
      startTime: dt.toISOString(),
      duration: 60,
      location: null,
      notes: `From ${senderName || "SMS"}: ${messageText.slice(0, 120)}`,
      confidenceScore: 0.92,
    });
  }

  if (lower.includes("medication") || lower.includes("prescription") || lower.includes("pharmacy")) {
    events.push({
      eventName: "Medication Reminder",
      startTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0).toISOString(),
      duration: 5,
      location: null,
      notes: `From ${senderName || "SMS"}: ${messageText.slice(0, 120)}`,
      confidenceScore: 0.88,
    });
  }

  if (lower.includes("meeting") || lower.includes("zoom") || lower.includes("standup") || lower.includes("call at")) {
    const timeMatch = messageText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    let dt = new Date(now.getTime() + 86400000);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3].toLowerCase() === "pm" && h < 12) h += 12;
      dt.setHours(h, m, 0, 0);
    }
    events.push({
      eventName: "Meeting",
      startTime: dt.toISOString(),
      duration: 30,
      location: null,
      notes: `From ${senderName || "SMS"}: ${messageText.slice(0, 120)}`,
      confidenceScore: 0.85,
    });
  }

  if (lower.includes("deadline") || lower.includes("due") || lower.includes("submit by")) {
    events.push({
      eventName: "Deadline",
      startTime: new Date(now.getTime() + 86400000 * 2).toISOString(),
      duration: 60,
      location: null,
      notes: `From ${senderName || "SMS"}: ${messageText.slice(0, 120)}`,
      confidenceScore: 0.80,
    });
  }

  if (lower.includes("dinner") || lower.includes("lunch") || lower.includes("brunch")) {
    const timeMatch = messageText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    let dt = new Date(now.getTime() + 86400000);
    if (timeMatch) {
      let h = parseInt(timeMatch[1]);
      const m = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3].toLowerCase() === "pm" && h < 12) h += 12;
      dt.setHours(h, m, 0, 0);
    } else {
      dt.setHours(18, 0, 0, 0);
    }
    events.push({
      eventName: lower.includes("dinner") ? "Dinner" : lower.includes("lunch") ? "Lunch" : "Brunch",
      startTime: dt.toISOString(),
      duration: 90,
      location: null,
      notes: `From ${senderName || "SMS"}: ${messageText.slice(0, 120)}`,
      confidenceScore: 0.82,
    });
  }

  if (events.length === 0) {
    events.push({
      eventName: `Reminder from ${senderName || "message"}`,
      startTime: new Date(now.getTime() + 86400000).toISOString(),
      duration: 30,
      location: null,
      notes: messageText.slice(0, 200),
      confidenceScore: 0.5,
    });
  }

  return events;
}
