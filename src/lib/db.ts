import { neon } from "@neondatabase/serverless";

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Add it to .env.local or Vercel environment variables."
    );
  }
  return url;
}

export function getSql() {
  return neon(getDatabaseUrl());
}
