# Bun + Hono Full-Stack Template

> A production-ready full-stack template with React frontend and Hono API backend, served by Bun in a single process with HMR, TypeScript, SQLite, validation, logging, and comprehensive testing.

## Features

- 🚀 **Bun Runtime** - Fast all-in-one JavaScript runtime with native TypeScript support
- ⚡️ **Hot Module Replacement (HMR)** - Instant updates during development
- 🎯 **React Router v7** - Data mode with loaders and actions
- 🎨 **shadcn/ui + Tailwind CSS** - Beautiful, accessible component library
- 🛣️ **Hono API** - Lightweight, Express-like API framework
- 💾 **bun:sqlite** - Native SQLite database with migration system
- ✅ **Zod Validation** - Type-safe request validation
- 📝 **Structured Logging** - pino for production-ready logging
- 🧪 **Comprehensive Testing** - vitest + Testing Library
- 🔒 **Type Safety** - End-to-end TypeScript with shared types
- 🎨 **Code Quality** - Biome formatter + husky pre-commit hooks

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.3.1 or higher

### Installation

```bash
# Clone or use as template
git clone <your-repo-url>
cd bun-hono

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Run migrations (creates SQLite database and seed data)
bun run migrate
```

### Development

```bash
# Start dev server with HMR
bun run dev

# Server runs on http://localhost:3000
# API available at http://localhost:3000/api/*
```

### Testing

```bash
# Run all tests (requires dev server running)
bun run test

# Run in watch mode
bun run test:watch
```

### Production Build

```bash
# Build for production
bun run build

# Run in production mode
NODE_ENV=production bun src/index.ts
```

## Project Overview

This template demonstrates a complete full-stack application with:

- **Single Port/Process**: Both React frontend and Hono API served by Bun.serve()
- **Database**: SQLite with migration system and seed data
- **Validation**: Zod schemas with automatic request validation
- **Error Handling**: Consistent ApiResponse wrapper with proper HTTP status codes
- **Logging**: Structured logging with pino (pretty-print in dev, JSON in production)
- **Testing**: Integration tests for API, unit tests for React components

### Example Application

The template includes a complete **Contacts** CRUD application:

- List all contacts with search and favorites
- View contact details
- Create new contacts with validation
- Update contact information
- Delete contacts
- Toggle favorite status

## Architecture

### Server (src/index.ts)

Bun.serve() handles both API routes and React app:

```typescript
const server = Bun.serve({
  routes: {
    "/api/*": app.fetch,  // Hono API routes
    "/*": index,          // React app (catch-all)
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});
```

### API Routes (src/api/)

Hono-based REST API with validation and error handling:

- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get contact by ID
- `POST /api/contacts` - Create new contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

All routes use:
- **Zod validation** via `@hono/zod-validator`
- **ApiResponse wrapper** for consistent responses
- **Error handling** with proper HTTP status codes (200, 201, 400, 404, 409, 500)
- **Structured logging** with context objects

### Database (bun:sqlite)

- **Location**: `./data/app.db` (configurable via `DATABASE_PATH`)
- **Migrations**: SQL-based migrations in `migrations/` directory
- **Auto-migrate**: Runs on server startup in development
- **WAL Mode**: Write-Ahead Logging enabled for better concurrency

### Frontend (React)

- **React Router v7** with data mode (loaders/actions)
- **shadcn/ui** components styled with Tailwind CSS
- **Custom API client** that unwraps ApiResponse and throws ApiError
- **Type-safe** with shared types between frontend and backend

## Database Migrations

### Creating Migrations

Create a new file in `migrations/` with format `NNN-description.sql`:

```sql
-- Up
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX users_email_idx ON users(email);

-- Seed data (optional)
INSERT INTO users (email) VALUES ('test@example.com');

-- Down
DROP INDEX IF EXISTS users_email_idx;
DROP TABLE IF EXISTS users;
```

### Migration Commands

```bash
# Apply all pending migrations
bun run migrate

# Explicit up
bun run migrate:up

# Rollback last migration
bun run migrate:down

# Show migration status
bun run migrate:status
```

### How Migrations Work

1. Migrations are tracked in the `migration` table
2. Each migration runs in a transaction (rollback on error)
3. Migrations are applied in order by filename
4. Both "Up" and "Down" sections are required
5. Migrations run automatically on server startup in development

## Adding New Features

### 1. Add a New API Endpoint

**Step 1**: Create Zod schema (`src/schemas/user.schema.ts`)

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
});
```

**Step 2**: Add route to API (`src/api/index.ts`)

```typescript
import { zValidator } from "@hono/zod-validator";
import { createUserSchema } from "@/schemas/user.schema";

api.post(
  "/users",
  zValidator("json", createUserSchema),
  async (c) => {
    try {
      const user = c.req.valid("json");
      const result = db.query("INSERT INTO users (...) VALUES (...) RETURNING *").get(user);

      const response: ApiResponse<User> = {
        success: true,
        data: result as User,
      };
      return c.json(response, 201);
    } catch (error) {
      logger.error({ error }, "Error creating user");
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Failed to create user",
      };
      return c.json(response, 500);
    }
  }
);
```

**Step 3**: Add types (`src/types/user.ts`)

```typescript
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export type NewUser = Omit<User, "id" | "created_at">;
```

**Step 4**: Create API helper (`src/lib/users.ts`)

```typescript
import { client } from "./client";
import type { User, NewUser } from "@/types/user";

const api = client.create({ baseURL: "http://localhost:3000" });

export const getUsers = () => api.get<User[]>("/api/users");
export const createUser = (user: NewUser) => api.post<User>("/api/users", user);
```

**Step 5**: Write tests (`src/tests/api/users.api.test.ts`)

```typescript
import { describe, expect, test } from "vitest";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/user";

const BASE_URL = process.env.API_URL || "http://localhost:3000";

describe("User API", () => {
  test("should create a new user", async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", name: "Test User" }),
    });
    const data = (await response.json()) as ApiResponse<User>;

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe("test@example.com");
  });
});
```

## Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./data/app.db

# Logging
LOG_LEVEL=info

# API (for tests)
API_URL=http://localhost:3000
```

## Project Structure

```
bun-hono/
├── migrations/              # SQL migration files
│   └── 001-initial-contacts.sql
├── src/
│   ├── api/                # Hono API routes
│   │   └── index.ts
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── db/                 # Database initialization
│   │   └── index.ts
│   ├── lib/                # Utilities
│   │   ├── client.ts      # API client wrapper
│   │   ├── contacts.ts    # Contact API helpers
│   │   ├── logger.ts      # pino logger config
│   │   └── utils.ts       # General utilities
│   ├── pages/              # React Router pages
│   │   ├── actions.ts     # React Router actions
│   │   └── loader.ts      # React Router loaders
│   ├── schemas/            # Zod validation schemas
│   │   └── contact.schema.ts
│   ├── scripts/            # CLI scripts
│   │   └── migrate.ts     # Migration CLI
│   ├── tests/              # Test files
│   │   ├── api/           # API integration tests
│   │   └── *.test.tsx     # Component tests
│   ├── types/              # TypeScript types
│   │   ├── api.ts         # ApiResponse
│   │   └── contacts.ts    # Contact types
│   ├── utils/              # Core utilities
│   │   └── migrate.ts     # Migration system
│   ├── AppRoutes.tsx       # React Router config
│   ├── index.html          # React app entry
│   └── index.ts            # Server entry
├── .env.example            # Environment template
├── .husky/                 # Git hooks
│   └── pre-commit         # Run biome check
├── biome.json              # Biome config
├── CLAUDE.md               # Development guide
├── PLAN.md                 # Implementation plan
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Technology Stack

### Runtime & Build
- [Bun](https://bun.sh) - All-in-one JavaScript runtime
- TypeScript - Type safety throughout

### Backend
- [Hono](https://hono.dev) - Fast, lightweight API framework
- [bun:sqlite](https://bun.sh/docs/api/sqlite) - Native SQLite database
- [Zod](https://zod.dev) - TypeScript-first validation
- [pino](https://getpino.io) - Fast, structured logging

### Frontend
- [React](https://react.dev) - UI library
- [React Router v7](https://reactrouter.com) - Routing with data loading
- [shadcn/ui](https://ui.shadcn.com) - Beautiful component library
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

### Development
- [vitest](https://vitest.dev) - Fast unit testing
- [@testing-library/react](https://testing-library.com) - React testing utilities
- [Biome](https://biomejs.dev) - Fast formatter/linter
- [husky](https://typicode.github.io/husky) - Git hooks

## API Response Format

All API endpoints return a consistent response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": { "id": 1, "firstName": "Jane", "lastName": "Doe" }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "data": null,
  "error": "Contact not found"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "data": null,
  "error": "Validation failed: email must be a valid email address"
}
```

## Deployment

### Fly.io Example

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch app: `fly launch`
4. Deploy: `fly deploy`

**fly.toml:**
```toml
app = "your-app-name"

[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 3000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

**Dockerfile:**
```dockerfile
FROM oven/bun:1.3.1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY . .
RUN bun build src/index.html --outdir=dist

ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "src/index.ts"]
```

### Environment Variables

Set production environment variables:

```bash
fly secrets set DATABASE_PATH=/data/app.db
fly secrets set LOG_LEVEL=info
fly secrets set NODE_ENV=production
```

## Contributing

This is a template project. Fork it, customize it, and make it your own!

## License

MIT

---

**Built with ❤️ using Bun**
