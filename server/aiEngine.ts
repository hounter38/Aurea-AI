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
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
