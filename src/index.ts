import { serve } from "bun";
import { Hono } from "hono";
import index from "./index.html";
import API from "./api";

const app = new Hono();
app.route("/api/", API);

const server = serve({
  routes: {
    "/api/*": app.fetch,  // API routes handled first
    "/*": index,          // React app serves everything else
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);