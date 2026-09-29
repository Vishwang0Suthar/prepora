import express from "express";
import cors from "cors";

import { env } from "./config/env";
import kitsRouter from "./routes/kits";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "prepora-api",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/kits", kitsRouter);

app.listen(env.port, () => {
  console.log(`🚀 Prepora API running on http://localhost:${env.port}`);
});
