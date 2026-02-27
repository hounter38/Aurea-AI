import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
  );
}

export function getAuthUrl(): string | null {
  const client = getOAuth2Client();
  if (!client) return null;

  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function handleCallback(code: string) {
  const client = getOAuth2Client();
  if (!client) throw new Error("Google OAuth not configured");
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function createCalendarEvent(
  title: string,
  startTime: Date,
  durationMinutes: number,
  description?: string,
  location?: string
): Promise<{ id: string; htmlLink: string; status: string }> {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

  if (!accessToken) {
    return simulateCalendarEvent(title, startTime, durationMinutes);
  }

  try {
    const client = getOAuth2Client();
    if (!client) return simulateCalendarEvent(title, startTime, durationMinutes);

    client.setCredentials({
      access_token: accessToken,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: "v3", auth: client });
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const result = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description || "",
        location: location || undefined,
        start: { dateTime: startTime.toISOString(), timeZone: "America/New_York" },
        end: { dateTime: endTime.toISOString(), timeZone: "America/New_York" },
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 15 }] },
      },
    });

    return {
      id: result.data.id || "",
      htmlLink: result.data.htmlLink || "",
      status: "created",
    };
  } catch (err) {
    console.error("Google Calendar API error:", err);
    return simulateCalendarEvent(title, startTime, durationMinutes);
  }
}

export async function getUpcomingEvents(maxResults = 20) {
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
  if (!accessToken) return [];

  try {
    const client = getOAuth2Client();
    if (!client) return [];

    client.setCredentials({
      access_token: accessToken,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: "v3", auth: client });
    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    return result.data.items || [];
  } catch {
    return [];
  }
}

function simulateCalendarEvent(title: string, startTime: Date, durationMinutes: number) {
  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    htmlLink: `https://calendar.google.com/calendar/event?eid=demo`,
    status: "simulated",
  };
}
