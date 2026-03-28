// Usage: npm run db:reset
// WARNING: destroys all data. Dev only.

import fs from "fs";
import { config } from "../config";
import { getDb, closeDb } from "./connection";
import { runMigrations } from "./schema";

async function reset() {
  if (config.nodeEnv === "production") {
    console.error("❌  Refusing to reset DB in production.");
    process.exit(1);
  }

  if (fs.existsSync(config.db.path)) {
    // Remove WAL files too if present
    for (const suffix of ["", "-shm", "-wal"]) {
      const f = config.db.path + suffix;
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }
    console.log("[reset] Deleted existing database files");
  }

  await getDb();
  await runMigrations();
  console.log("[reset] ✅  Fresh database ready");
  await closeDb();
}

reset().catch((err) => {
  console.error("[reset] Fatal:", err);
  process.exit(1);
});