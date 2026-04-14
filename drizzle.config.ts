import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

// drizzle-kit 不會像 Next 一樣自動讀 .env.local，需手動載入
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error(
    "缺少 DATABASE_URL。請在 .env.local 設定 Supabase 連線字串，或執行：DATABASE_URL=... npm run db:push"
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
