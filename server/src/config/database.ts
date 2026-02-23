import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { env } from "./env";

const dbPath = path.resolve(process.cwd(), env.DB_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db: Database.Database = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
