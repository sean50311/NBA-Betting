import { NextResponse } from "next/server";
import {
  fetchAllPlayoffGames,
  hasNbaApiKey,
  nbaSeasonFromEnv,
} from "@/lib/nba-client";
import { upsertNbaGames } from "@/lib/nba-game-cache";
import { settlePendingBetsForGames } from "@/lib/settlement";
import { gameHasStarted, gameIsFinal } from "@/lib/game-state";
import { getSessionUserId } from "@/lib/session-server";
import { db } from "@/db";
import { bets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { oddsForRound, playoffRoundFromDate } from "@/config/playoff";
import { bpsToOdds } from "@/config/playoff";

export const runtime = "nodejs";

export async function GET() {
  if (!hasNbaApiKey()) {
    return NextResponse.json(
      {
        error: "缺少 BALLDONTLIE_API_KEY，請在 .env.local 設定（見 BallDontLie NBA API）",
        games: [],
      },
      { status: 200 }
    );
  }

  try {
    const season = nbaSeasonFromEnv();
    const games = await fetchAllPlayoffGames(season);

    await upsertNbaGames(games).catch(() => {});

    const ids = games.map((g) => g.id);
    const gamesById = new Map(games.map((g) => [g.id, g]));
    const pendRows = await db
      .select({ gameId: bets.gameId })
      .from(bets)
      .where(eq(bets.status, "pending"));
    const pendIds = [...new Set(pendRows.map((r) => r.gameId))];
    await settlePendingBetsForGames([...new Set([...ids, ...pendIds])], gamesById);

    const uid = await getSessionUserId();
    const userBets =
      uid != null ? await db.select().from(bets).where(eq(bets.userId, uid)) : [];

    const betByGame = new Map<number, (typeof userBets)[0]>();
    for (const b of userBets) {
      betByGame.set(b.gameId, b);
    }

    const payload = games.map((g) => {
      const started = gameHasStarted(g);
      const final = gameIsFinal(g);
      const round = playoffRoundFromDate(g.date);
      const odds = oddsForRound(round);
      const mine = betByGame.get(g.id);

      return {
        id: g.id,
        date: g.date,
        datetime: g.datetime,
        status: g.status,
        period: g.period,
        postseason: g.postseason,
        season: g.season,
        home_team: g.home_team,
        visitor_team: g.visitor_team,
        home_team_score: g.home_team_score,
        visitor_team_score: g.visitor_team_score,
        round,
        roundLabel: ["第一輪", "第二輪", "分區冠軍", "總冠軍"][round - 1],
        odds,
        canBet: !started && !final,
        isFinal: final,
        myBet: mine
          ? {
              pickedTeamId: mine.pickedTeamId,
              stake: mine.stake,
              odds: bpsToOdds(mine.odds),
              status: mine.status,
              payout: mine.payout,
            }
          : null,
      };
    });

    return NextResponse.json({ games: payload, season });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "無法載入賽事";
    return NextResponse.json({ error: msg, games: [] }, { status: 500 });
  }
}
