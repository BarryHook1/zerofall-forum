import "dotenv/config";

import { defineConfig, env } from "prisma/config";

type Env = {
  DATABASE_URL: string;
  DIRECT_URL: string;
};

// Prisma 7.7's config API doesn't yet accept a separate `directUrl` next to
// `url`. For Supabase, migrations need the direct connection (:5432) because
// pgbouncer's transaction-pool mode rejects DDL/SET/prepared-statements.
// Prefer DIRECT_URL when present — it's safe for both runtime and migrations,
// just slightly less optimized than the pooled endpoint. Fall back to
// DATABASE_URL so this still works for environments without a pool split.
const url =
  process.env.DIRECT_URL && process.env.DIRECT_URL.length > 0
    ? env<Env>("DIRECT_URL")
    : env<Env>("DATABASE_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: { url },
});
