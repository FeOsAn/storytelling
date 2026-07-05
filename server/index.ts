/**
 * Single-port entry: Express serves both the API (/api/*) and the client. In dev it
 * mounts Vite middleware; in production it serves the built client from dist/public.
 */

import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { registerRoutes } from "./routes";
import { securityHeaders } from "./security";

const PORT = Number(process.env.PORT || 5000);
const isProd = process.env.NODE_ENV === "production";

async function main() {
  const app = express();
  // Behind Railway's proxy: real client IPs for rate limiting, Secure cookies.
  app.set("trust proxy", 1);
  app.use(securityHeaders);
  app.use(express.json({ limit: "1mb" }));

  if (isProd && !process.env.CITED_ADMIN_PASSWORD) {
    console.warn(
      "[security] CITED_ADMIN_PASSWORD is not set — operator routes are LOCKED until it is.",
    );
  }

  const server = createServer(app);
  await registerRoutes(server, app);

  if (isProd) {
    // Production runs the bundled dist/index.cjs from the repo root (see deploy docs),
    // so the built client is at <cwd>/dist/public. Avoid import.meta here — it is empty
    // in the CJS bundle.
    const clientDir = path.resolve(process.cwd(), "dist/public");
    app.use(express.static(clientDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  }

  server.listen(PORT, () => {
    console.log(`StoryFit listening on http://localhost:${PORT} (${isProd ? "production" : "dev"})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
