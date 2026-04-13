import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  avatarDataUrl: text("avatar_data_url"),
  points: integer("points").notNull().default(1000),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const bets = sqliteTable(
  "bets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: integer("game_id").notNull(),
    pickedTeamId: integer("picked_team_id").notNull(),
    stake: integer("stake").notNull(),
    odds: integer("odds_bps").notNull(),
    round: integer("round").notNull(),
    status: text("status").notNull(),
    payout: integer("payout"),
    settledAt: integer("settled_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("bets_user_game").on(t.userId, t.gameId)]
);

export type User = typeof users.$inferSelect;
export type Bet = typeof bets.$inferSelect;
