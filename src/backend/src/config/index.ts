import path from "path";
import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: (process.env.NODE_ENV ?? "development") === "development",

  db: {
    path: path.resolve(
      process.cwd(),
      process.env.DB_PATH ?? "./data/codespace.db"
    ),
  },

  auth: {
    sessionSecret: requireEnv(
      "SESSION_SECRET",
      "dev-secret-change-in-production"
    ),
    // Session tokens expire after 24 hours of inactivity
    tokenTTLMs: 24 * 60 * 60 * 1000,
  },

  static: {
    path: path.resolve(
      process.cwd(),
      process.env.STATIC_PATH ?? "../renderer/dist"
    ),
  },

  room: {
    codeLength: 6,
    // No ambiguous characters: 0/O and 1/I removed
    codeChars: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
    maxMembersPerRoom: 20,
  },
} as const;