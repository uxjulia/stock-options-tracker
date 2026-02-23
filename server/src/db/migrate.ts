import fs from "fs";
import path from "path";
import db from "../config/database";

export function runMigrations(): void {
  const schemaPath = path.resolve(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Split on semicolons, strip comment-only lines from each chunk,
  // then skip chunks that have no actual SQL left
  const statements = schema
    .split(";")
    .map((chunk) => {
      // Remove comment lines but keep the actual SQL lines
      const lines = chunk
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("--"));
      return lines.join("\n").trim();
    })
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      db.exec(statement + ";");
    } catch (err) {
      // Ignore errors on PRAGMA statements which may already be set
      const upper = statement.toUpperCase().trimStart();
      if (!upper.startsWith("PRAGMA")) {
        throw err;
      }
    }
  }

  console.log("✅ Database migrations complete");
}
