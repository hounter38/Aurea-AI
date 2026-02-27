const request = require("supertest");
const app = require("../app");

describe("GET /api/health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/events", () => {
  it("returns a list of events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);
  });
});

describe("POST /api/events", () => {
  it("creates a new event", async () => {
    const res = await request(app)
      .post("/api/events")
      .send({ title: "Test Event", type: "general" });
    expect(res.status).toBe(201);
    expect(res.body.event.title).toBe("Test Event");
  });

  it("rejects event without title", async () => {
    const res = await request(app).post("/api/events").send({});
    expect(res.status).toBe(400);
  });
});
