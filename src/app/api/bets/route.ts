import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session-server";
import { placeOrUpdateBet } from "@/lib/bets-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const gameId = Number(body.gameId);
    const pickedTeamId = Number(body.pickedTeamId);
    const stake = Number(body.stake);

    if (!Number.isFinite(gameId) || !Number.isFinite(pickedTeamId) || !Number.isFinite(stake)) {
      return NextResponse.json({ error: "參數無效" }, { status: 400 });
    }

    await placeOrUpdateBet(uid, gameId, pickedTeamId, stake);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "下注失敗";
    const status = msg.includes("積分") ? 400 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
