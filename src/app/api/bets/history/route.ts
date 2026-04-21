import { NextResponse } from "next/server";
import { db } from "@/db";
import { bets } from "@/db/schema";
import { getSessionUserId } from "@/lib/session-server";
import { eq, desc } from "drizzle-orm";
import { fetchGameForBetting } from "@/lib/nba-client";
import { getCachedGamesByIds } from "@/lib/nba-game-cache";
import { bpsToOdds } from "@/config/playoff";
import type { NBAGame } from "@/lib/nba-types";

export const runtime = "nodejs";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(bets)
    .where(eq(bets.userId, uid))
    .orderBy(desc(bets.createdAt));

  const gameIds = [...new Set(rows.map((r) => r.gameId))];
  const fromDb = await getCachedGamesByIds(gameIds);
  const gameById = new Map<number, NBAGame | null>();
  for (const gid of gameIds) {
    const hit = fromDb.get(gid);
    if (hit) gameById.set(gid, hit);
  }
  for (const gid of gameIds) {
    if (gameById.has(gid)) continue;
    gameById.set(gid, await fetchGameForBetting(gid));
  }

  const items = [];
  for (const b of rows) {
    const game = gameById.get(b.gameId) ?? null;
    items.push({
      id: b.id,
      gameId: b.gameId,
      stake: b.stake,
      odds: bpsToOdds(b.odds),
      round: b.round,
      status: b.status,
      payout: b.payout,
      settledAt: b.settledAt,
      createdAt: b.createdAt,
      pickedTeamId: b.pickedTeamId,
      game: game
        ? {
            date: game.date,
            datetime: game.datetime,
            home_team: game.home_team,
            visitor_team: game.visitor_team,
            home_team_score: game.home_team_score,
            visitor_team_score: game.visitor_team_score,
            status: game.status,
          }
        : null,
    });
  }

  return NextResponse.json({ bets: items });
}
