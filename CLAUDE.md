# Architecture

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun run test` which calls `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `vitest` to write tests with describe, test, expect
Use `@testing-library/react` for React tests

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Server
Using `Bun.serve` to serve both React frontend and Hono based API routes in the same port/process
```typescript
import { Hono } from "hono";
import api from "./api";
import index from "./index.html";

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
```

## Backend
- Use Hono to define API routes in `src/api` (alias @api)

```typescript
const api = new Hono();

// fetch all contacts
api.get("/contacts", async (c) => c.json(db.getAll<Contact>("contacts")));

// fetch contact by id
api.get("/contacts/:id", async (c) =>
  c.json(db.getById<Contact>("contacts", c.req.param("id"))),
);

// create new contact
api.post("/contacts", async (c) => {
  const contact = (await c.req.json()) as NewContact;
  return c.json(db.insert<NewContact>("contacts", contact));
});
```

## Frontend
- Use React with React Router Data Mode, shadcn/ui, and Tailwind
- Routes are defined in `src/AppRoutes.tsx`
- UI Routes are defined in `src/Pages` (`@/pagese`)
- Components are defined in `src/Components` (`@/components`)
- Use loaders and actions for data fetching/mutations running client side
- Use helper functions that calls the API routes (src/lib/contacts.ts)
- Use the `client.create` fetch wrapper (src/lib/client.ts)


## Types
- Use TypeScript types and share them between fronend and backend in the `src/types` folder (alias @types)
