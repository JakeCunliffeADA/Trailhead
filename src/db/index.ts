import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

// Module-level singleton — re-used across hot-reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var _db: ReturnType<typeof createDb> | undefined;
}

export const db =
  process.env.NODE_ENV === "production"
    ? createDb()
    : (globalThis._db ??= createDb());

export type Db = typeof db;
