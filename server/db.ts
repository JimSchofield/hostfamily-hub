import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

const url = process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "NETLIFY_DATABASE_URL (or DATABASE_URL) must be set. Did you forget to provision the Netlify database?",
  );
}

const sql = neon(url);
export const db = drizzle(sql, { schema });
