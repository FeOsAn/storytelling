import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(dir, "client"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dir, "client/src"),
      "@shared": path.resolve(dir, "shared"),
      "@assets": path.resolve(dir, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(dir, "dist/public"),
    emptyOutDir: true,
  },
});
