import "dotenv/config";

import { defineConfig, env } from "prisma/config";

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // Single DATABASE_URL. Use Supabase's DIRECT connection (:5432) — the
    // pooled endpoint (:6543, pgbouncer) can't run all migration DDL, and
    // Prisma 7.7's config API doesn't yet expose a separate directUrl.
    // If you hit Vercel connection limits later, migrate to Prisma Accelerate
    // or add a pooled client config.
    url: env<Env>("DATABASE_URL"),
  },
});
