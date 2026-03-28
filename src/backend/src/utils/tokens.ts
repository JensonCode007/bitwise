import crypto from "crypto";
import { config } from "../config";

// Room codes

/**
 * Generates a cryptographically random 6-character room code.
 * Uses an unambiguous charset — no 0/O or 1/I so codes are easy to read aloud.
 * Example output: "K7NQ2R"
 */
export function generateRoomCode(): string {
  const chars = config.room.codeChars;
  const len = config.room.codeLength;
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

// ---------------------------------------------------------------------------
// Session tokens
// ---------------------------------------------------------------------------

/**
 * Generates a secure 64-character hex session token.
 *
 * - The raw `token` is returned to the client exactly once at join time.
 * - Only `tokenHash` (SHA-256) is persisted in the database.
 * - If the DB is ever leaked, tokens cannot be reversed from hashes.
 */
export function generateToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function nowMs(): number {
  return Date.now();
}

export function isTokenExpired(
  lastSeenAt: number,
  ttlMs: number
): boolean {
  return Date.now() - lastSeenAt > ttlMs;
}