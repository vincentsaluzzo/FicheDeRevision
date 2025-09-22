import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { initializeDatabase } from "./models/database";
import revisionRoutes from "./routes/revision";
import healthRoutes from "./routes/health";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for Docker/network access
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
  origin: corsOrigin
    ? corsOrigin.split(',').map(origin => origin.trim()) // Support multiple origins separated by comma
    : [
        // Default origins for Docker/local development
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Local network IPs
        /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, // Docker internal IPs
        /^http:\/\/172\.\d+\.\d+\.\d+:3000$/, // Docker bridge IPs
      ],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const uploadsDir = process.env.UPLOADS_DIR || "./uploads";
app.use("/uploads", express.static(path.join(process.cwd(), uploadsDir)));

app.use("/api/health", healthRoutes);
app.use("/api/revision", revisionRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Revision Sheet Generator API",
    version: "1.0.0",
    status: "running",
  });
});

export const startServer = async () => {
  try {
    await initializeDatabase();
    console.log("✅ Database initialized successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
      console.log(
        `🌐 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`
      );
      console.log(`DEBUG_AI: ${process.env.DEBUG_AI}`);
      console.log(
        `OPENAI_MODEL: ${process.env.OPENAI_MODEL || "gpt-4o-mini (default) "}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down...");
  process.exit(0);
});

export default app;
