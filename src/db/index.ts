import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

let _db: Db | undefined;

/**
 * Supabase **Session pooler** 與 **Transaction pooler** 皆經過 PgBouncer。
 * 使用 `postgres.js` 時必須關閉預編譯查詢（prepare: false），否則可能出現
 * “prepared statement already exists” 等錯誤。
 *
 * Session pooler 常見格式（port 可能為 5432）：
 * postgresql://postgres.xxx:[PASSWORD]@aws-xxx.pooler.supabase.com:5432/postgres
 *
 * Transaction pooler 常見為 port 6543，同樣適用。
 */
function shouldDisablePreparedStatements(url: string): boolean {
  return (
    /\.pooler\.supabase\.com/i.test(url) ||
    url.includes(":6543") ||
    url.includes("pgbouncer=true")
  );
}

function getOrCreateDb(): Db {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error(
      "缺少 DATABASE_URL。請在 Supabase：Project Settings → Database → Connection string 複製 URI 到 .env.local"
    );
  }

  const pooler = shouldDisablePreparedStatements(url);

  const client = postgres(url, {
    max: 1,
    prepare: !pooler,
  });

  _db = drizzle(client, { schema });
  return _db;
}

/** 延遲連線：首次使用資料庫時才建立連線（避免僅 import 就要求環境變數） */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const d = getOrCreateDb();
    const value = Reflect.get(d, prop, receiver);
    return typeof value === "function" ? value.bind(d) : value;
  },
});
