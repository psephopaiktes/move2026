import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { ratingsDevPlugin } from "./plugins/ratings-dev-plugin";

// GitHub Pages の base はリポジトリ名のみ。
// `https://<username>.github.io/<repo>/` 配信なので "/move2026/" だけでよい。
// `/<username>/<repo>/` にすると HTML が読み込む asset パスが /<username>/<repo>/<username>/<repo>/... と二重化されて 404 になり、ページが真っ白になる。
const REPO_BASE = "/move2026/";

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
