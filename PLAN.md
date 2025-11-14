# Bun-Hono Template - Implementation Plan

This document tracks the implementation of production-ready features for the bun-hono full-stack template.

**Goal**: Create a solid baseline template for our internal tools and services with proper database, validation, error handling, logging, and testing.

**Porting From**: `/Users/michael/Projects/oss/claude/hono-vite-template` - We've already solved these problems!

---

## Progress Overview

- [x] Phase 1: Setup (Migration Infrastructure) ✅
- [x] Phase 2: Database (bun:sqlite) ✅
- [x] Phase 3: Validation (Zod + Error Handling) ✅
- [x] Phase 4: Logging (pino) ✅
- [x] Phase 5: Client (Error Handling) ✅
- [x] Phase 6: Testing (API Integration Tests) ✅
- [x] Phase 7: Documentation ✅

**🎉 ALL PHASES COMPLETE!**

---

## Phase 1: Setup - Migration Infrastructure

**Commit Message**: `feat: add migration system infrastructure`

### Tasks
- [x] Add dependencies (pino, pino-pretty, zod, @hono/zod-validator)
- [x] Create `migrations/` directory at project root
- [x] Port `migrate.ts` utility from hono-vite-template (adapt better-sqlite3 → bun:sqlite)
- [x] Create `src/scripts/migrate.ts` CLI script
- [x] Add migration scripts to package.json:
  - `migrate` - Apply pending migrations
  - `migrate:up` - Explicit up
  - `migrate:down` - Rollback last
  - `migrate:status` - Show status

### Files to Create/Modify
- `src/utils/migrate.ts` - Core migration logic
- `src/scripts/migrate.ts` - CLI wrapper
- `package.json` - Add scripts and dependencies
- `migrations/` - Directory for SQL files

---

## Phase 2: Database - bun:sqlite Implementation

**Commit Message**: `feat: replace in-memory db with bun:sqlite`

### Tasks
- [x] Replace `src/db/index.ts` with bun:sqlite implementation
- [x] Create `001-initial-contacts.sql` migration with Up/Down
- [x] Update db initialization to call `migrate(db)` on startup
- [x] Test migration commands work:
  - `bun run migrate` (apply) ✅
  - `bun run migrate:status` (check) ✅
  - `bun run migrate:down` (rollback) ✅
  - `bun run migrate:up` (re-apply) ✅
- [x] Remove `data/data.json` (no longer needed)
- [x] Add `data/` to .gitignore (for SQLite files)

### Files to Create/Modify
- `src/db/index.ts` - Replace with bun:sqlite
- `migrations/001-initial-contacts.sql` - Schema migration
- `.gitignore` - Add data/ directory
- Remove: `data/data.json`

---

## Phase 3: Validation - Zod + Error Handling

**Commit Message**: `feat: add zod validation and error handling`

### Tasks
- [x] Create `src/schemas/` directory
- [x] Create `src/schemas/contact.schema.ts` with:
  - `createContactSchema`
  - `updateContactSchema`
  - `idParamSchema`
- [x] Add `ApiResponse<T>` type to `src/types/api.ts`:
  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
  }
  ```
- [x] Update `src/api/index.ts` with:
  - `zValidator` middleware on all routes
  - Try/catch error handling
  - Proper HTTP status codes (200, 201, 404, 409, 500)
  - `ApiResponse<T>` wrapper on all responses
  - Unique constraint error handling (409 for duplicates)
- [x] Test API endpoints return proper error responses

### Files to Create/Modify
- `src/schemas/contact.schema.ts` - New file
- `src/types/api.ts` - New file with ApiResponse
- `src/api/index.ts` - Update all routes
- `src/types/contacts.ts` - Keep existing types

---

## Phase 4: Logging - Structured Logging with pino

**Commit Message**: `feat: add pino structured logging`

### Tasks
- [x] Dependencies already added in Phase 1
- [x] Create `src/lib/logger.ts`:
  - Configure pino with level from env
  - Pretty-print for development
  - JSON for production
- [x] Replace all `console.log` with `logger.info`
- [x] Replace all `console.error` with `logger.error`
- [x] Update migration system to use logger
- [x] Update API routes to use logger
- [x] Update server startup to use logger

### Files to Create/Modify
- `src/lib/logger.ts` - New file
- `src/api/index.ts` - Use logger
- `src/utils/migrate.ts` - Use logger
- `src/scripts/migrate.ts` - Use logger
- `src/index.ts` - Use logger

---

## Phase 5: Client - Error Handling

**Commit Message**: `feat: improve client error handling`

### Tasks
- [x] Update `src/lib/client.ts` to:
  - Handle `ApiResponse<T>` format
  - Extract error messages from response body
  - Throw typed errors with status codes
- [x] Create custom error type:
  ```typescript
  class ApiError extends Error {
    status: number;
    constructor(message: string, status: number)
  }
  ```
- [x] Update `src/lib/contacts.ts` to handle new response format (automatic via client)
- [x] Update frontend components to handle ApiError
- [x] Update loaders/actions for new response format with try/catch

### Files to Create/Modify
- `src/lib/client.ts` - Better error handling
- `src/lib/contacts.ts` - Handle ApiResponse
- `src/pages/loader.ts` - Update for new format
- `src/pages/actions.ts` - Update for new format

---

## Phase 6: Testing - Comprehensive API Tests ✅

**Commit Message**: `test: add comprehensive API tests`

### Tasks
- [x] Create `src/tests/api/` directory for API tests
- [x] Write tests for contact endpoints:
  - GET /api/contacts - List all (2 tests)
  - GET /api/contacts/:id - Get by ID (success + 404 + invalid ID)
  - POST /api/contacts - Create (success + duplicate 409 + validation 400)
  - PATCH /api/contacts/:id - Update (success + toggle favorite + 404)
  - DELETE /api/contacts/:id - Delete (success + 404 + invalid ID)
- [x] Update existing React component tests for new response format
- [x] Run all tests and verify they pass:
  ```bash
  bun run test
  ```
  **Result**: All 23 tests passing! 🎉

### Files to Create/Modify
- `src/tests/api/contacts.api.test.ts` - New file (15 integration tests)
- `src/tests/contacts.test.tsx` - Already compatible ✅
- `src/tests/contactDetail.test.tsx` - Already compatible ✅
- `src/tests/contactForm.test.tsx` - Already compatible ✅

---

## Phase 7: Documentation - Complete the Template ✅

**Commit Message**: `docs: add complete documentation and examples`

### Tasks
- [x] Create `.env.example`:
  ```
  # Server Configuration
  PORT=3000
  NODE_ENV=development

  # Database
  DATABASE_PATH=./data/app.db

  # Logging
  LOG_LEVEL=info
  ```
- [x] Update `CLAUDE.md` with:
  - Migration system usage
  - Zod validation patterns
  - Error handling conventions
  - Logging patterns
  - ApiResponse format
  - How to add new routes
  - Complete project structure
  - Environment variables
  - Testing patterns
- [x] Write comprehensive `README.md`:
  - Project overview with features
  - Quick start guide
  - Development workflow
  - Testing guide
  - Deployment instructions (Fly.io example with Dockerfile)
  - Complete project structure
  - Technology stack
  - API response format examples
  - Step-by-step guide for adding new features
- [x] Verify production build works:
  ```bash
  bun run build
  NODE_ENV=production bun src/index.ts
  ```
  **Result**: Build successful (180ms), server runs with JSON logging ✅
- [x] Test the app end-to-end in production mode
  **Result**: API endpoints working correctly ✅

### Files to Create/Modify
- `.env.example` - Created with all variables ✅
- `CLAUDE.md` - Major updates with comprehensive patterns ✅
- `README.md` - Complete rewrite with examples ✅
- Production build and runtime - Verified working ✅

---

## Commit Strategy

After completing each phase:

1. Run tests: `bun run test`
2. Verify app works: `bun run dev`
3. Stage changes: `git add .`
4. Commit with conventional commit message (shown above)
5. Continue to next phase

---

## Key Decisions & Trade-offs

1. **bun:sqlite vs better-sqlite3**: Using Bun's native SQLite (no dependencies!)
2. **Monorepo vs Single Package**: Simplified to single package for our use case
3. **pino for logging**: Same as beehiiv, battle-tested
4. **No ORM**: Direct SQL for simplicity and transparency
5. **ApiResponse wrapper**: Consistent error handling across all endpoints
6. **Migration on startup**: Auto-migrate in dev, explicit in prod (via DATABASE_PATH check)

---

## Success Criteria

✅ Database persists across restarts
✅ Migrations work (up/down/status)
✅ All API routes validated with Zod
✅ Proper error responses (404, 400, 500)
✅ Structured logging throughout
✅ All tests pass
✅ README explains deployment
✅ Can use as template for new projects

---

**Last Updated**: 2025-11-13
**Status**: 🎉 **ALL PHASES COMPLETE** 🎉

The bun-hono template is now production-ready with:
- ✅ SQLite database with migration system
- ✅ Zod validation on all API routes
- ✅ Structured logging with pino
- ✅ Comprehensive error handling
- ✅ Full test coverage (23 tests passing)
- ✅ Complete documentation (README + CLAUDE.md)
- ✅ Production build verified working

**Ready to use as a template for new projects!** 🚀
