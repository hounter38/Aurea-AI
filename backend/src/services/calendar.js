const { google } = require("googleapis");

async function createCalendarEvent(event, credentials) {
  if (!credentials || !credentials.access_token) {
    return simulateCalendarCreate(event);
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(credentials);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const startDate = new Date(event.datetime);
  const endDate = new Date(
    startDate.getTime() + (event.duration_minutes || 30) * 60000
  );

  const calendarEvent = {
    summary: event.title,
    description: event.notes || "",
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "America/New_York",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "America/New_York",
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "popup", minutes: 15 }],
    },
  };

  if (event.type === "medication") {
    calendarEvent.colorId = "2";
    calendarEvent.reminders.overrides.push({ method: "popup", minutes: 0 });
  }

  const result = await calendar.events.insert({
    calendarId: "primary",
    resource: calendarEvent,
  });

  return {
    id: result.data.id,
    htmlLink: result.data.htmlLink,
    status: "created",
    provider: "google_calendar",
  };
}

function simulateCalendarCreate(event) {
  const startDate = new Date(event.datetime);
  const endDate = new Date(
    startDate.getTime() + (event.duration_minutes || 30) * 60000
  );

  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    htmlLink: `https://calendar.google.com/calendar/event?eid=simulated`,
    status: "simulated",
    provider: "demo_mode",
    event: {
      summary: event.title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: event.type,
      notes: event.notes,
    },
  };
}

module.exports = { createCalendarEvent, simulateCalendarCreate };
