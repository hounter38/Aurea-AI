import { google } from "googleapis";

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" +
      hostname +
      "/api/v2/connection?include_secrets=true&connector_names=google-calendar",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error("Google Calendar not connected");
  }
  return accessToken;
}

// WARNING: Never cache this client. Access tokens expire.
export async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function createCalendarEvent(
  eventName: string,
  startTime: Date,
  durationMinutes: number,
  location?: string | null,
  notes?: string | null
) {
  const calendar = await getUncachableGoogleCalendarClient();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: eventName,
      location: location ?? undefined,
      description: notes ?? undefined,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    },
  });

  return response.data;
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getUncachableGoogleCalendarClient();
  await calendar.events.delete({ calendarId: "primary", eventId });
}

export async function getUpcomingEvents(maxResults = 20) {
  const calendar = await getUncachableGoogleCalendarClient();
  const now = new Date();

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}

export async function getTodayEvents() {
  const calendar = await getUncachableGoogleCalendarClient();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}
