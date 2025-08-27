import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import statsRoutes from "./routes/stats";
import llmRoutes from "./routes/llm";
import activityRoutes from "./routes/activity";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(","), credentials: false }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/stats", statsRoutes);
app.use("/llm", llmRoutes);
app.use("/activity", activityRoutes);

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));