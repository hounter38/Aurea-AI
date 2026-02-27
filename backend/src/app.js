const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "aurea-backend" });
});

app.get("/api/events", (_req, res) => {
  res.json({
    events: [
      {
        id: "1",
        title: "Deep Work Block",
        start: new Date().toISOString(),
        type: "focus",
      },
      {
        id: "2",
        title: "Medication Reminder – Vitamin D",
        start: new Date(Date.now() + 3600000).toISOString(),
        type: "medication",
      },
    ],
  });
});

app.post("/api/events", (req, res) => {
  const { title, type } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }
  const event = {
    id: String(Date.now()),
    title,
    start: new Date().toISOString(),
    type: type || "general",
  };
  res.status(201).json({ event });
});

module.exports = app;
