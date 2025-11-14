#!/usr/bin/env bun

import { Database } from "bun:sqlite";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../lib/logger";
import { migrate, rollback, status } from "../utils/migrate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default to project root data folder in development, allow override via env
const defaultDbPath = join(__dirname, "../../data/app.db");
const dbPath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : defaultDbPath;
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.exec("PRAGMA journal_mode = WAL");

const command = process.argv[2];
const toArg = process.argv.indexOf("--to");
const toValue =
  toArg !== -1 ? Number.parseInt(process.argv[toArg + 1], 10) : undefined;

try {
  switch (command) {
    case "up":
    case undefined: {
      // Apply all pending migrations
      logger.info("Running migrations...");
      migrate(db);
      logger.info("✅ Migrations complete");
      break;
    }

    case "down": {
      // Rollback migrations
      if (toValue !== undefined) {
        logger.info(`Rolling back to migration ${toValue}...`);
        rollback(db, { to: toValue });
      } else {
        logger.info("Rolling back last migration...");
        rollback(db);
      }
      logger.info("✅ Rollback complete");
      break;
    }

    case "status": {
      // Show migration status
      status(db);
      break;
    }

    default: {
      logger.error(`Unknown command: ${command}`);
      logger.info(`
Usage:
  bun run migrate         Apply all pending migrations
  bun run migrate up      Apply all pending migrations
  bun run migrate down    Rollback last migration
  bun run migrate down --to <number>  Rollback to specific migration
  bun run migrate status  Show migration status
      `);
      process.exit(1);
    }
  }
} catch (error) {
  logger.error("Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}
