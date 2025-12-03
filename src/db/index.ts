import { Database as BunDatabase } from "bun:sqlite";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { logger } from "../lib/logger";
import { migrate } from "../utils/migrate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Database singleton wrapper
 * Provides HMR-safe access to the database instance
 */
export class Database {
  private static instance: Database | null = null;
  private db: BunDatabase;

  private constructor() {
    // Default to project root data folder in development, allow override via env
    const defaultDbPath = join(__dirname, "../../data/app.db");
    const dbPath = process.env.DATABASE_PATH
      ? resolve(process.env.DATABASE_PATH)
      : defaultDbPath;

    this.db = new BunDatabase(dbPath);

    // Enable WAL mode for better concurrency
    this.db.exec("PRAGMA journal_mode = WAL");

    // Run migrations on startup
    migrate(this.db);

    logger.info({ dbPath }, "Database initialized");
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  static dispose() {
    if (Database.instance) {
      Database.instance.close();
      Database.instance = null;
      logger.info("Database disposed");
    }
  }

  /**
   * Get the underlying Bun SQLite database instance
   * Use this for all database operations
   */
  getDb(): BunDatabase {
    return this.db;
  }

  close() {
    this.db.close();
  }
}

// Convenience export for direct database access
// Use Database.getInstance().getDb() if you need the singleton
export const db = Database.getInstance().getDb();
