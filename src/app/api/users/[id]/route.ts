import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, bets } from "@/db/schema";
import { displayPoints, pendingStakeSumForUser } from "@/lib/display-points";
import { eq } from "drizzle-orm";
import { aggregateBetStats, emptyStats } from "@/lib/user-stats";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "無效的使用者" }, { status: 400 });
  }

  const rows = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      avatarDataUrl: users.avatarDataUrl,
      points: users.points,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id));

  const u = rows[0];
  if (!u) {
    return NextResponse.json({ error: "找不到使用者" }, { status: 404 });
  }

  const betRows = await db
    .select({ userId: bets.userId, status: bets.status })
    .from(bets)
    .where(eq(bets.userId, id));

  const statsByUser = aggregateBetStats(betRows);
  const s = statsByUser.get(id) ?? emptyStats();
  const pendingStake = await pendingStakeSumForUser(id);

  return NextResponse.json({
    user: {
      id: u.id,
      nickname: u.nickname,
      avatarDataUrl: u.avatarDataUrl,
      points: displayPoints(u.points, pendingStake),
      createdAt: u.createdAt.toISOString(),
      wins: s.wins,
      losses: s.losses,
      pending: s.pending,
      totalBets: s.totalBets,
      winRate: s.winRate,
    },
  });
}
