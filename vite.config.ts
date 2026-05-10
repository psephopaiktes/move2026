import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { ratingsDevPlugin } from "./plugins/ratings-dev-plugin";

const REPO_BASE = "/psephopaiktes/move2026/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? REPO_BASE : "/",
  plugins: [react(), ratingsDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    open: true,
  },
}));
