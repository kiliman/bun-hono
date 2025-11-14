import { Hono } from "hono";
import api from "./api";
import index from "./index.html";
import { logger } from "./lib/logger";

const app = new Hono();
app.route("/api/", api);

const server = Bun.serve({
  routes: {
    "/api/*": app.fetch, // API routes handled first
    "/*": index, // React app serves everything else
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

logger.info(
  { url: server.url.toString(), port: server.port },
  "Server running",
);
