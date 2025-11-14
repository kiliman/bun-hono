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

### API Routes (Hono)
- Use Hono to define API routes in `src/api` (alias @/api)
- All routes use Zod validation with `@hono/zod-validator`
- All responses use `ApiResponse<T>` wrapper format
- Use structured logging with `logger` from `src/lib/logger.ts`
- Proper error handling with try/catch and HTTP status codes

```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { logger } from "@/lib/logger";
import { createContactSchema, idParamSchema } from "@/schemas/contact.schema";
import type { ApiResponse } from "@/types/api";

const api = new Hono();

// GET endpoint with validation
api.get(
  "/contacts/:id",
  zValidator("param", idParamSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const contact = db.query("SELECT * FROM contacts WHERE id = ?").get(Number(id));

      if (!contact) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: "Contact not found",
        };
        return c.json(response, 404);
      }

      const response: ApiResponse<Contact> = {
        success: true,
        data: contact as Contact,
      };
      return c.json(response);
    } catch (error) {
      logger.error({ error }, "Error fetching contact");
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Failed to fetch contact",
      };
      return c.json(response, 500);
    }
  }
);

// POST endpoint with validation
api.post(
  "/contacts",
  zValidator("json", createContactSchema),
  async (c) => {
    try {
      const contact = c.req.valid("json");
      const result = db
        .query("INSERT INTO contacts (...) VALUES (...) RETURNING *")
        .get(contact);

      const response: ApiResponse<Contact> = {
        success: true,
        data: result as Contact,
      };
      return c.json(response, 201);
    } catch (error) {
      // Handle unique constraint violations
      if (error.message?.includes("UNIQUE constraint")) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: "Username or email already exists",
        };
        return c.json(response, 409);
      }

      logger.error({ error }, "Error creating contact");
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Failed to create contact",
      };
      return c.json(response, 500);
    }
  }
);
```

### Database (bun:sqlite)
- Use `bun:sqlite` for database operations
- Database initialized in `src/db/index.ts`
- Migrations run automatically on startup via `migrate(db)`
- Use prepared statements for queries
- Enable WAL mode for better concurrency

```typescript
import { Database } from "bun:sqlite";
import { migrate } from "../utils/migrate";

const dbPath = process.env.DATABASE_PATH || "./data/app.db";
export const db = new Database(dbPath);

// Enable Write-Ahead Logging for better concurrency
db.exec("PRAGMA journal_mode = WAL");

// Run migrations on startup
migrate(db);
```

### Migrations
- SQL-based migrations in `migrations/` directory
- Format: `NNN-description.sql` (e.g., `001-initial-contacts.sql`)
- Each migration has `-- Up` and `-- Down` sections
- Migrations run in transactions for safety
- Migration state tracked in `migration` table

**Migration File Format:**
```sql
-- Up
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  -- ...
);

CREATE INDEX contacts_username_idx ON contacts(username);

-- Seed data (optional)
INSERT INTO contacts (...) VALUES (...);

-- Down
DROP INDEX IF EXISTS contacts_username_idx;
DROP TABLE IF EXISTS contacts;
```

**Migration Commands:**
```bash
bun run migrate         # Apply pending migrations
bun run migrate:up      # Explicit up
bun run migrate:down    # Rollback last migration
bun run migrate:status  # Show migration status
```

### Validation (Zod)
- Define schemas in `src/schemas/` directory
- One schema file per resource (e.g., `contact.schema.ts`)
- Use `@hono/zod-validator` middleware in API routes
- Validation happens before route handler executes

```typescript
import { z } from "zod";

// Create schema - all fields required
export const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Invalid email address"),
  // ...
});

// Update schema - all fields optional
export const updateContactSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  // ...
});

// Param validation
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number"),
});
```

### Error Handling & Response Format
- All API responses use `ApiResponse<T>` wrapper
- Consistent error handling with proper HTTP status codes
- Client automatically unwraps `ApiResponse` and throws `ApiError`

**ApiResponse Type:**
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

**HTTP Status Codes:**
- `200` - Success (GET, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate username/email)
- `500` - Internal Server Error

### Logging (pino)
- Use `logger` from `src/lib/logger.ts`
- Pretty-print in development, JSON in production
- Log level controlled by `LOG_LEVEL` env var
- Use structured logging with context objects

```typescript
import { logger } from "@/lib/logger";

// Info logging
logger.info({ userId: 123 }, "User logged in");

// Error logging
logger.error({ error, contactId: id }, "Failed to update contact");

// Debug logging
logger.debug({ query, params }, "Executing database query");
```

## Frontend

### Architecture
- React with React Router v7 Data Mode (loaders/actions)
- shadcn/ui components + Tailwind CSS
- Routes defined in `src/AppRoutes.tsx`
- Pages in `src/pages/` (alias `@/pages`)
- Components in `src/components/` (alias `@/components`)
- Loaders and actions for data fetching/mutations (client-side)

### API Client
- Custom fetch wrapper in `src/lib/client.ts`
- Automatically handles `ApiResponse<T>` format
- Unwraps successful responses, throws `ApiError` on failure
- Helper functions in `src/lib/contacts.ts` for resource operations

**Client Usage:**
```typescript
import { client } from "@/lib/client";
import { ApiError } from "@/lib/client";

const api = client.create({ baseURL: "http://localhost:3000" });

// GET request - returns unwrapped data
const contact = await api.get<Contact>("/api/contacts/1");

// POST request
try {
  const newContact = await api.post<Contact>("/api/contacts", {
    firstName: "John",
    lastName: "Doe",
    // ...
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.status}: ${error.message}`);
  }
}
```

### Loaders & Actions
- Use React Router loaders for data fetching
- Use React Router actions for mutations
- Handle `ApiError` gracefully with try/catch
- Return error objects to display in UI

```typescript
import { redirect, type ActionFunctionArgs } from "react-router";
import { ApiError } from "@/lib/client";
import { createContact } from "@/lib/contacts";

export const newContactAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  try {
    const newContact = await createContact({
      firstName: formData.get("firstName") as string,
      // ...
    });
    return redirect(`/contacts/${newContact.id}`);
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Failed to create contact" };
  }
};
```

## Testing

### Test Setup
- Use `vitest` for test framework (compatible with Bun)
- Use `@testing-library/react` for React component tests
- API tests are integration tests against running dev server

### Running Tests
```bash
bun run test              # Run all tests
bun run test:watch        # Watch mode
```

### API Integration Tests
- Located in `src/tests/api/`
- Require dev server running on port 3000
- Test full request/response cycle including validation
- Use `API_URL` env var to configure base URL

**Example API Test:**
```typescript
import { describe, expect, test } from "vitest";
import type { ApiResponse } from "@/types/api";
import type { Contact } from "@/types/contacts";

const BASE_URL = process.env.API_URL || "http://localhost:3000";

describe("Contact API", () => {
  test("should return all contacts", async () => {
    const response = await fetch(`${BASE_URL}/api/contacts`);
    const data = (await response.json()) as ApiResponse<Contact[]>;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### React Component Tests
- Located in `src/tests/`
- Use Testing Library best practices
- Mock API calls with MSW or similar

## Types
- Use TypeScript types shared between frontend and backend
- Located in `src/types/` directory (alias `@/types`)
- Export types for resources, API responses, and schemas

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// src/types/contacts.ts
export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  // ...
}
```

## Environment Variables
- Bun automatically loads `.env` file (no dotenv needed)
- Copy `.env.example` to `.env` and customize
- Available variables:
  - `PORT` - Server port (default: 3000)
  - `NODE_ENV` - Environment (development/production)
  - `DATABASE_PATH` - SQLite database file path
  - `LOG_LEVEL` - Logging level (trace/debug/info/warn/error/fatal)
  - `API_URL` - Base URL for API tests

## Project Structure
```
bun-hono/
├── migrations/           # SQL migration files
│   └── 001-initial-contacts.sql
├── src/
│   ├── api/             # Hono API routes
│   │   └── index.ts
│   ├── components/      # React components
│   ├── db/              # Database initialization
│   │   └── index.ts
│   ├── lib/             # Utilities (client, logger, etc.)
│   │   ├── client.ts
│   │   ├── contacts.ts
│   │   └── logger.ts
│   ├── pages/           # React Router pages
│   ├── schemas/         # Zod validation schemas
│   │   └── contact.schema.ts
│   ├── scripts/         # CLI scripts
│   │   └── migrate.ts
│   ├── tests/           # Test files
│   │   ├── api/         # API integration tests
│   │   └── *.test.tsx   # Component tests
│   ├── types/           # TypeScript types
│   │   ├── api.ts
│   │   └── contacts.ts
│   ├── utils/           # Core utilities
│   │   └── migrate.ts   # Migration system
│   ├── index.html       # React app entry
│   └── index.ts         # Server entry
├── .env.example         # Environment variables template
├── CLAUDE.md            # This file
├── PLAN.md              # Implementation plan
└── package.json
```
