import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./routes/auth";
import statsRoutes from "./routes/stats";
import llmRoutes from "./routes/llm";
import activityRoutes from "./routes/activity";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"], 
  credentials: false 
}));
app.use(express.json());
// Masquer l'en-tête Authorization dans les logs
app.use(morgan("dev", {
  stream: process.stdout,
  skip: () => false
}));

// Rate limiting pour l'authentification (anti bruteforce)
const authLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 10, // 10 tentatives par minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes avec rate limiting pour l'auth
app.use("/auth", authLimiter, authRoutes);
app.use("/stats", statsRoutes);
app.use("/llm", llmRoutes);
app.use("/activity", activityRoutes);

// 404
app.use((_req: Request, res: Response) => res.status(404).json({ error: "Not found" }));

// Error handler (ne JAMAIS laisser une exception faire tomber le process)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled route error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Process-level safety
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));