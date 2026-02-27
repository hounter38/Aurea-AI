import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";
import { MemoryStorage, DatabaseStorage } from "./storage.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemoryStorage();

const router = Router();
registerRoutes(router, storage);
app.use(router);

const isDev = process.env.NODE_ENV !== "production";

(async () => {
  if (isDev) {
    const { setupVite } = await import("./vite.js");
    await setupVite(app);
  } else {
    const { serveStatic } = await import("./static.js");
    serveStatic(app);
  }

  const PORT = parseInt(process.env.PORT || "5000");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aurea server running on http://localhost:${PORT}`);
    console.log(`Mode: ${process.env.OPENAI_API_KEY ? "Live AI" : "Demo (simulation)"}`);
    console.log(`Database: ${process.env.DATABASE_URL ? "PostgreSQL" : "In-memory"}`);
    console.log(`Calendar: ${process.env.GOOGLE_ACCESS_TOKEN ? "Google Calendar" : "Simulated"}`);
  });
})();
