import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { fetchGameById } from "./nba-client";
import { getCachedGamesByIds } from "./nba-game-cache";
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
    let game: NBAGame | null | undefined =
      gamesById?.get(gid) ?? (await fetchGameById(gid, { noCache: true }));
    if (!game) {
      game = (await getCachedGamesByIds([gid])).get(gid) ?? null;
    }
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
      /** 贏家總返還（含本金）= stake × 賠率；下注時已先扣 stake */
      const payout = won ? Math.round(b.stake * odds) : 0;

      const didSettle = await db.transaction(async (tx) => {
        const updated = await tx
          .update(bets)
          .set({
            status: won ? "won" : "lost",
            payout,
            settledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(bets.id, b.id), eq(bets.status, "pending")))
          .returning({ id: bets.id });

        if (updated.length === 0) return false;

        if (payout > 0) {
          await tx
            .update(users)
            .set({ points: sql`${users.points} + ${payout}` })
            .where(eq(users.id, b.userId));
        }
        return true;
      });

      if (didSettle) settled++;
    }
  }

  return settled;
}
