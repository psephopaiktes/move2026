import type { Plugin, ViteDevServer } from "vite";
import { promises as fs } from "node:fs";
import path from "node:path";

interface Rating {
  stars: number;
  memo: string;
  updatedAt: string;
}

interface RatingsFile {
  ratings: Record<string, Rating>;
}

const FILE_PATH = path.resolve(process.cwd(), "src/data/ratings.json");

async function readFileSafe(): Promise<RatingsFile> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { ratings: {} };
  }
}

async function writeFileSafe(data: RatingsFile): Promise<void> {
  const json = JSON.stringify(data, null, 2) + "\n";
  await fs.writeFile(FILE_PATH, json, "utf8");
}

function readBody(req: import("http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * 開発時のみ /api/ratings を提供する Vite plugin。
 * - GET  /api/ratings           => ratings.json をそのまま返す
 * - PUT  /api/ratings/:id       => 1物件分の Rating を upsert
 * - DELETE /api/ratings/:id     => 1物件分の Rating を削除
 *
 * 本番ビルドには含まれない（apply: "serve"）ので GitHub Pages では存在しない。
 * 書き込みは src/data/ratings.json を直接更新するため、評価結果は git diff として現れる。
 */
export function ratingsDevPlugin(): Plugin {
  return {
    name: "ratings-dev-plugin",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/api/ratings", async (req, res) => {
        try {
          if (req.method === "GET") {
            const data = await readFileSafe();
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(data));
            return;
          }

          // /api/ratings/:id 形式
          const segments = (req.url ?? "").split("?")[0].split("/").filter(Boolean);
          const id = segments[0]; // /api/ratings は middlewares.use でstrip済 → :id だけ残る

          if (req.method === "PUT" && id) {
            const body = await readBody(req);
            const rating = JSON.parse(body) as Rating;
            const data = await readFileSafe();
            data.ratings[id] = rating;
            await writeFileSafe(data);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (req.method === "DELETE" && id) {
            const data = await readFileSafe();
            delete data.ratings[id];
            await writeFileSafe(data);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          res.statusCode = 405;
          res.end("Method Not Allowed");
        } catch (err) {
          console.error("[ratings-dev-plugin]", err);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    },
  };
}
