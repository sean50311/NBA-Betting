import { NextResponse } from "next/server";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { bpsToOdds, isPublicBetsHidden, playoffRoundFromDate } from "@/config/playoff";
import { gameIsFinal } from "@/lib/game-state";
import { fetchGameForBetting } from "@/lib/nba-client";
import { getCachedGamesByIds } from "@/lib/nba-game-cache";
import type { NBAGame } from "@/lib/nba-types";

export const runtime = "nodejs";

async function gameMetaForBets(
  gameId: number
): Promise<{ round: number; isFinal: boolean }> {
  const cached = await getCachedGamesByIds([gameId]);
  const game: NBAGame | null | undefined =
    cached.get(gameId) ?? (await fetchGameForBetting(gameId));
  if (game) {
    return {
      round: playoffRoundFromDate(game.date),
      isFinal: gameIsFinal(game),
    };
  }

  const rows = await db
    .select({ round: bets.round, status: bets.status })
    .from(bets)
    .where(eq(bets.gameId, gameId));
  const round = rows[0]?.round ?? 1;
  const allSettled =
    rows.length > 0 && rows.every((r) => r.status === "won" || r.status === "lost");
  return { round, isFinal: allSettled };
}

/** 公開：該場次所有玩家的下注摘要（不含帳號密碼） */
export async function GET(_req: Request, ctx: { params: Promise<{ gameId: string }> }) {
  const { gameId: gidStr } = await ctx.params;
  const gameId = Number(gidStr);
  if (!Number.isFinite(gameId) || gameId < 1) {
    return NextResponse.json({ error: "無效的場次" }, { status: 400 });
  }

  const { round, isFinal } = await gameMetaForBets(gameId);
  if (isPublicBetsHidden(round, isFinal)) {
    return NextResponse.json({
      bets: [],
      publicBetsHidden: true,
      message: "本分區冠軍賽／總冠軍賽進行中不公開其他玩家下注；完場後可查看",
    });
  }

  const rows = await db
    .select({
      betId: bets.id,
      userId: users.id,
      nickname: users.nickname,
      avatarDataUrl: users.avatarDataUrl,
      pickedTeamId: bets.pickedTeamId,
      stake: bets.stake,
      oddsBps: bets.odds,
      status: bets.status,
      payout: bets.payout,
      createdAt: bets.createdAt,
    })
    .from(bets)
    .innerJoin(users, eq(bets.userId, users.id))
    .where(eq(bets.gameId, gameId))
    .orderBy(desc(bets.createdAt));

  const list = rows.map((r) => ({
    betId: r.betId,
    userId: r.userId,
    nickname: r.nickname,
    avatarDataUrl: r.avatarDataUrl,
    pickedTeamId: r.pickedTeamId,
    stake: r.stake,
    odds: bpsToOdds(r.oddsBps),
    status: r.status,
    payout: r.payout,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ bets: list, publicBetsHidden: false });
}
