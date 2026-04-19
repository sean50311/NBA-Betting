import { NextResponse } from "next/server";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { fetchGameById } from "@/lib/nba-client";
import { bpsToOdds } from "@/config/playoff";

export const runtime = "nodejs";

/** 公開：指定使用者的下注紀錄（與 /api/bets/history 類似，但不需登入） */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const userId = Number(idStr);
  if (!Number.isFinite(userId) || userId < 1) {
    return NextResponse.json({ error: "無效的使用者" }, { status: 400 });
  }

  const exists = await db.select({ id: users.id }).from(users).where(eq(users.id, userId));
  if (exists.length === 0) {
    return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(bets)
    .where(eq(bets.userId, userId))
    .orderBy(desc(bets.createdAt));

  const items = [];
  for (const b of rows) {
    const game = await fetchGameById(b.gameId);
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
