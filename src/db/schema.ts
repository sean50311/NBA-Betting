import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { NBATeam } from "@/lib/nba-types";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: text("nickname").notNull(),
  avatarDataUrl: text("avatar_data_url"),
  points: integer("points").notNull().default(1000),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
});

export const bets = pgTable(
  "bets",
  {
    id: serial("id").primaryKey(),
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
    settledAt: timestamp("settled_at", { mode: "date", withTimezone: true }),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("bets_user_game").on(t.userId, t.gameId)]
);

/**
 * BallDontLie 場次快照：由賽程 API 寫入／更新，下注紀錄顯示時優先查此表，降低外部 API 呼叫與 429。
 * game_id = BallDontLie games.id
 */
export const nbaGames = pgTable("nba_games", {
  gameId: integer("game_id").primaryKey(),
  season: integer("season").notNull(),
  date: text("date").notNull(),
  datetime: text("datetime"),
  status: text("status"),
  period: integer("period"),
  periodDetail: text("period_detail"),
  time: text("time"),
  postseason: boolean("postseason").notNull(),
  homeTeamScore: integer("home_team_score"),
  visitorTeamScore: integer("visitor_team_score"),
  homeTeam: jsonb("home_team").$type<NBATeam>().notNull(),
  visitorTeam: jsonb("visitor_team").$type<NBATeam>().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Bet = typeof bets.$inferSelect;
export type NbaGameRow = typeof nbaGames.$inferSelect;
