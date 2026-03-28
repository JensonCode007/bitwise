import { getDb } from "./connection";

const SCHEMA = `
-- ============================================================
-- rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id         TEXT    PRIMARY KEY,
  code       TEXT    NOT NULL UNIQUE,
  name       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rooms_code   ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active);

-- ============================================================
-- room_members
-- One row per user session. No signup — identity is the token.
-- ============================================================
CREATE TABLE IF NOT EXISTS room_members (
  id           TEXT    PRIMARY KEY,
  room_id      TEXT    NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name TEXT    NOT NULL,
  token        TEXT    NOT NULL UNIQUE,
  token_hash   TEXT    NOT NULL UNIQUE,
  joined_at    INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  is_online    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_members_room   ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_members_token  ON room_members(token_hash);
CREATE INDEX IF NOT EXISTS idx_members_online ON room_members(room_id, is_online);
`;

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  await db.exec(SCHEMA);
  console.log("[db] Migrations complete");
}