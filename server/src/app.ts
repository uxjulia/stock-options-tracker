import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: false, // relaxed for dev; tighten in prod if serving static
    })
  );

  app.use(
    cors({
      origin:
        env.NODE_ENV === "production"
          ? false
          : ["http://localhost:5173", "http://localhost:3001"],
      credentials: true,
    })
  );

  // Parsing
  app.use(express.json());
  app.use(cookieParser());

  // API routes
  app.use("/api", apiRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
