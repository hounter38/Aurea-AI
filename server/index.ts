import "dotenv/config";
import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { MemoryStorage, DatabaseStorage } from "./storage.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemoryStorage();

// Register API routes directly on the app
registerRoutes(app, storage);

const PORT = parseInt(process.env.PORT || "5000");

// Start the server first so the API works immediately
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Aurea server running on http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.OPENAI_API_KEY ? "Live AI" : "Demo (simulation)"}`);
  console.log(`Database: ${process.env.DATABASE_URL ? "PostgreSQL" : "In-memory"}`);
  console.log(`Calendar: ${process.env.GOOGLE_ACCESS_TOKEN ? "Google Calendar" : "Simulated"}`);

  // Set up Vite AFTER the server is running (frontend is optional)
  if (process.env.NODE_ENV !== "production") {
    try {
      const { setupVite } = await import("./vite.js");
      await setupVite(app);
      console.log("Vite dev server ready");
    } catch (err) {
      console.log("Vite frontend not available (API still works):", (err as Error).message);
    }
  }
});
