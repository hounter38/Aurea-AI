const request = require("supertest");
const app = require("../app");

describe("GET /api/health", () => {
  it("returns ok status with mode info", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.mode).toBeDefined();
  });
});

describe("POST /api/messages/sms", () => {
  it("ingests an SMS message", async () => {
    const res = await request(app).post("/api/messages/sms").send({
      sender: "+1234567890",
      body: "Your doctor appointment is on 3/15 at 2pm",
      device_platform: "android",
    });
    expect(res.status).toBe(201);
    expect(res.body.message.source).toBe("sms");
    expect(res.body.message.status).toBe("received");
  });

  it("rejects SMS without body", async () => {
    const res = await request(app).post("/api/messages/sms").send({});
    expect(res.status).toBe(400);
  });
});

describe("POST /api/messages/call", () => {
  it("ingests a call transcript", async () => {
    const res = await request(app).post("/api/messages/call").send({
      caller: "Mom",
      transcript: "Remember to take your medication at 9am every day",
      duration_seconds: 120,
      device_platform: "ios",
    });
    expect(res.status).toBe(201);
    expect(res.body.message.source).toBe("call");
  });
});

describe("POST /api/messages/email", () => {
  it("ingests an email", async () => {
    const res = await request(app).post("/api/messages/email").send({
      sender: "hr@company.com",
      subject: "Team standup",
      body: "Reminder: daily standup meeting at 10am tomorrow",
    });
    expect(res.status).toBe(201);
    expect(res.body.message.source).toBe("email");
  });
});

describe("POST /api/process-inline", () => {
  it("processes a message and extracts calendar events (demo mode)", async () => {
    const res = await request(app).post("/api/process-inline").send({
      body: "Your dentist appointment is scheduled for 3/20 at 3pm",
      source: "sms",
      sender: "+1555000111",
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processed");
    expect(res.body.events_created).toBeGreaterThan(0);
    expect(res.body.mode).toBe("demo_simulation");
    expect(res.body.events[0].calendar.provider).toBe("demo_mode");
  });
});

describe("GET /api/events", () => {
  it("returns processed events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });
});

describe("GET /api/messages", () => {
  it("returns ingested messages", async () => {
    const res = await request(app).get("/api/messages");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
  });
});
