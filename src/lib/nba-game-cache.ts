import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { nbaGames, type NbaGameRow } from "@/db/schema";
import type { NBAGame } from "@/lib/nba-types";

export function rowToNbaGame(r: NbaGameRow): NBAGame {
  return {
    id: r.gameId,
    season: r.season,
    date: r.date,
    datetime: r.datetime,
    status: r.status,
    period: r.period,
    time: r.time,
    period_detail: r.periodDetail,
    postseason: r.postseason,
    home_team_score: r.homeTeamScore,
    visitor_team_score: r.visitorTeamScore,
    home_team: r.homeTeam,
    visitor_team: r.visitorTeam,
  };
}

export async function getCachedGamesByIds(ids: number[]): Promise<Map<number, NBAGame>> {
  const uniq = [...new Set(ids)].filter((n) => Number.isFinite(n));
  if (uniq.length === 0) return new Map();

  const rows = await db.select().from(nbaGames).where(inArray(nbaGames.gameId, uniq));
  const m = new Map<number, NBAGame>();
  for (const r of rows) {
    m.set(r.gameId, rowToNbaGame(r));
  }
  return m;
}

/** 將賽程／單場 API 回寫資料庫，供下注紀錄與 API 失敗時後援使用 */
export async function upsertNbaGames(games: NBAGame[]): Promise<void> {
  if (games.length === 0) return;
  const now = new Date();

  const rows = games.map((g) => ({
    gameId: g.id,
    season: g.season,
    date: g.date,
    datetime: g.datetime,
    status: g.status,
    period: g.period,
    periodDetail: g.period_detail,
    time: g.time,
    postseason: g.postseason,
    homeTeamScore: g.home_team_score,
    visitorTeamScore: g.visitor_team_score,
    homeTeam: g.home_team,
    visitorTeam: g.visitor_team,
    updatedAt: now,
  }));

  await db
    .insert(nbaGames)
    .values(rows)
    .onConflictDoUpdate({
      target: nbaGames.gameId,
      set: {
        season: sql`excluded.season`,
        date: sql`excluded.date`,
        datetime: sql`excluded.datetime`,
        status: sql`excluded.status`,
        period: sql`excluded.period`,
        periodDetail: sql`excluded.period_detail`,
        time: sql`excluded.time`,
        postseason: sql`excluded.postseason`,
        homeTeamScore: sql`excluded.home_team_score`,
        visitorTeamScore: sql`excluded.visitor_team_score`,
        homeTeam: sql`excluded.home_team`,
        visitorTeam: sql`excluded.visitor_team`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}
