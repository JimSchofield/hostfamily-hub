import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.NETLIFY_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("NETLIFY_DATABASE_URL (or DATABASE_URL) must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url },
});
