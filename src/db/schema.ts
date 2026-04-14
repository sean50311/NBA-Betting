import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type Bet = typeof bets.$inferSelect;
