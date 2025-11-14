import { Database } from "bun:sqlite";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "../utils/migrate";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default to project root data folder in development, allow override via env
const defaultDbPath = join(__dirname, "../../data/app.db");
const dbPath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : defaultDbPath;

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.exec("PRAGMA journal_mode = WAL");

// Run migrations on startup
migrate(db);

console.log(`📦 Database initialized at ${dbPath}`);
