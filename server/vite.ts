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
    // `npm run dev` runs from the repo root, so the client lives at <cwd>/client.
    root: path.resolve(process.cwd(), "client"),
    appType: "spa",
    server: { middlewareMode: true, hmr: { server } },
  });
  app.use(vite.middlewares);
}
