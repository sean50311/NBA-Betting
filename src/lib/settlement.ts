import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { fetchGameById } from "./nba-client";
import type { NBAGame } from "./nba-types";
import { gameIsFinal, winnerTeamId } from "./game-state";
import { bpsToOdds } from "@/config/playoff";

/**
 * 結算待處理下注。優先使用與賽程列表相同的 `gamesById`（避免單場 API 快取與列表不一致導致永不結算）。
 */
export async function settlePendingBetsForGames(
  gameIds: number[],
  gamesById?: ReadonlyMap<number, NBAGame>
): Promise<number> {
  const ids = [...new Set(gameIds)];
  let settled = 0;

  for (const gid of ids) {
    const game =
      gamesById?.get(gid) ?? (await fetchGameById(gid, { noCache: true }));
    if (!game || !gameIsFinal(game)) continue;

    const winId = winnerTeamId(game);
    if (winId == null) continue;

    const pending = await db
      .select()
      .from(bets)
      .where(and(eq(bets.gameId, gid), eq(bets.status, "pending")));

    for (const b of pending) {
      const odds = bpsToOdds(b.odds);
      const won = b.pickedTeamId === winId;
      const payout = won ? Math.round(b.stake * odds) : 0;

      await db.transaction(async (tx) => {
        await tx
          .update(bets)
          .set({
            status: won ? "won" : "lost",
            payout,
            settledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(bets.id, b.id));

        await tx
          .update(users)
          .set({ points: sql`${users.points} + ${payout}` })
          .where(eq(users.id, b.userId));
      });

      settled++;
    }
  }

  return settled;
}
