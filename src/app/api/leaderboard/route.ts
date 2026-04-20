import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, bets } from "@/db/schema";
import { displayPoints, pendingStakeSumByUser } from "@/lib/display-points";
import { aggregateBetStats, emptyStats } from "@/lib/user-stats";

export const runtime = "nodejs";

export async function GET() {
  const [userRows, betRows, pendingByUser] = await Promise.all([
    db
      .select({
        id: users.id,
        nickname: users.nickname,
        avatarDataUrl: users.avatarDataUrl,
        points: users.points,
      })
      .from(users),
    db.select({ userId: bets.userId, status: bets.status }).from(bets),
    pendingStakeSumByUser(),
  ]);

  const statsByUser = aggregateBetStats(betRows);

  const rows = userRows.map((u) => {
    const s = statsByUser.get(u.id) ?? emptyStats();
    const pendingStake = pendingByUser.get(u.id) ?? 0;
    return {
      id: u.id,
      nickname: u.nickname,
      avatarDataUrl: u.avatarDataUrl,
      points: displayPoints(u.points, pendingStake),
      wins: s.wins,
      losses: s.losses,
      pending: s.pending,
      totalBets: s.totalBets,
      winRate: s.winRate,
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.nickname.localeCompare(b.nickname, "zh-Hant");
  });

  const ranked = rows.map((r, i) => ({ rank: i + 1, ...r }));

  return NextResponse.json({ leaderboard: ranked });
}
