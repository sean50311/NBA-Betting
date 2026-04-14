import { NextResponse } from "next/server";
import { db } from "@/db";
import { bets } from "@/db/schema";
import { getSessionUserId } from "@/lib/session-server";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const all = await db.select().from(bets).where(eq(bets.userId, uid));

  const settled = all.filter((b) => b.status !== "pending");
  const wins = settled.filter((b) => b.status === "won").length;
  const losses = settled.filter((b) => b.status === "lost").length;

  let netPoints = 0;
  for (const b of settled) {
    const pay = b.payout ?? 0;
    netPoints += pay - b.stake;
  }

  const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;

  return NextResponse.json({
    totalBets: all.length,
    pending: all.filter((b) => b.status === "pending").length,
    settled: settled.length,
    wins,
    losses,
    winRate,
    netPoints,
  });
}
