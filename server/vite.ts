/**
 * Dev-only Vite middleware (single-port). In production we serve the built client
 * from dist/public instead (see server/index.ts). This file is imported lazily so
 * the production bundle never needs Vite at runtime.
 */

import type { Express } from "express";
import type { Server } from "node:http";
import path from "node:path";

export async function setupVite(app: Express, server: Server): Promise<void> {
  const { createServer } = await import("vite");
  const vite = await createServer({
    // Vite only auto-discovers a config inside `root` (client/), but ours —
    // with the @ / @shared aliases — lives at the repo root. Point at it
    // explicitly or dev serving breaks on every aliased import.
    configFile: path.resolve(process.cwd(), "vite.config.ts"),
    appType: "spa",
    server: { middlewareMode: true, hmr: { server } },
  });
  app.use(vite.middlewares);
}
