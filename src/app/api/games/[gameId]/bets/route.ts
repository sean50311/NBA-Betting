import { NextResponse } from "next/server";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { bpsToOdds } from "@/config/playoff";

export const runtime = "nodejs";

/** 公開：該場次所有玩家的下注摘要（不含帳號密碼） */
export async function GET(_req: Request, ctx: { params: Promise<{ gameId: string }> }) {
  const { gameId: gidStr } = await ctx.params;
  const gameId = Number(gidStr);
  if (!Number.isFinite(gameId) || gameId < 1) {
    return NextResponse.json({ error: "無效的場次" }, { status: 400 });
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

  return NextResponse.json({ bets: list });
}
