import { serve } from "bun";
import { Hono } from "hono";
import api from "./api";
import index from "./index.html";

const app = new Hono();
app.route("/api/", api);

const server = serve({
  routes: {
    "/api/*": app.fetch, // API routes handled first
    "/*": index, // React app serves everything else
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
