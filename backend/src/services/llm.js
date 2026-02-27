const OpenAI = require("openai");

const SYSTEM_PROMPT = `You are Aurea, an AI assistant that extracts calendar-worthy events from SMS messages, call summaries, and emails.

Given a raw message, extract ALL actionable items and return them as a JSON array.

Each item must have:
- "title": short event title
- "datetime": ISO 8601 string (use the current year if not specified)
- "duration_minutes": estimated duration (default 30)
- "type": one of "appointment", "medication", "deadline", "meeting", "reminder", "focus"
- "notes": any extra context

If the message contains no actionable events, return an empty array.
Return ONLY valid JSON, no markdown fences.`;

async function extractEvents(messageText, source, apiKey) {
  if (!apiKey) {
    return simulateExtraction(messageText, source);
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Source: ${source}\nMessage: ${messageText}\nToday: ${new Date().toISOString().split("T")[0]}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 1024,
  });

  const raw = completion.choices[0].message.content.trim();
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function simulateExtraction(messageText, source) {
  const lower = messageText.toLowerCase();
  const events = [];
  const now = new Date();

  if (
    lower.includes("appointment") ||
    lower.includes("doctor") ||
    lower.includes("dentist")
  ) {
    const match = messageText.match(
      /(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/
    );
    const dateStr = match ? match[1] : null;
    let dt = new Date(now.getTime() + 86400000 * 3);
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed)) dt = parsed;
    }
    events.push({
      title: "Doctor Appointment",
      datetime: dt.toISOString(),
      duration_minutes: 60,
      type: "appointment",
      notes: `Extracted from ${source}: ${messageText.slice(0, 100)}`,
    });
  }

  if (
    lower.includes("medication") ||
    lower.includes("prescription") ||
    lower.includes("pharmacy") ||
    lower.includes("pill") ||
    lower.includes("dose")
  ) {
    events.push({
      title: "Medication Reminder",
      datetime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        9,
        0
      ).toISOString(),
      duration_minutes: 5,
      type: "medication",
      notes: `Extracted from ${source}: ${messageText.slice(0, 100)}`,
    });
  }

  if (
    lower.includes("meeting") ||
    lower.includes("call") ||
    lower.includes("zoom") ||
    lower.includes("standup")
  ) {
    const timeMatch = messageText.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    let dt = new Date(now.getTime() + 86400000);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      if (timeMatch[3].toLowerCase() === "pm" && hours < 12) hours += 12;
      if (timeMatch[3].toLowerCase() === "am" && hours === 12) hours = 0;
      dt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        hours,
        minutes
      );
    }
    events.push({
      title: "Meeting",
      datetime: dt.toISOString(),
      duration_minutes: 30,
      type: "meeting",
      notes: `Extracted from ${source}: ${messageText.slice(0, 100)}`,
    });
  }

  if (
    lower.includes("deadline") ||
    lower.includes("due") ||
    lower.includes("submit")
  ) {
    events.push({
      title: "Deadline",
      datetime: new Date(now.getTime() + 86400000 * 2).toISOString(),
      duration_minutes: 60,
      type: "deadline",
      notes: `Extracted from ${source}: ${messageText.slice(0, 100)}`,
    });
  }

  if (events.length === 0) {
    events.push({
      title: `Event from ${source}`,
      datetime: new Date(now.getTime() + 86400000).toISOString(),
      duration_minutes: 30,
      type: "reminder",
      notes: `Extracted from ${source}: ${messageText.slice(0, 100)}`,
    });
  }

  return events;
}

module.exports = { extractEvents, simulateExtraction };
