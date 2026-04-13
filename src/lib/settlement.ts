import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { fetchGameById } from "./nba-client";
import { gameIsFinal, winnerTeamId } from "./game-state";
import { bpsToOdds } from "@/config/playoff";

export async function settlePendingBetsForGames(gameIds: number[]): Promise<number> {
  const ids = [...new Set(gameIds)];
  let settled = 0;

  for (const gid of ids) {
    const game = await fetchGameById(gid);
    if (!game || !gameIsFinal(game)) continue;

    const winId = winnerTeamId(game);
    if (winId == null) continue;

    const pending = db
      .select()
      .from(bets)
      .where(and(eq(bets.gameId, gid), eq(bets.status, "pending")))
      .all();

    for (const b of pending) {
      const odds = bpsToOdds(b.odds);
      const won = b.pickedTeamId === winId;
      const payout = won ? Math.round(b.stake * odds) : 0;

      db.transaction((tx) => {
        tx.update(bets)
          .set({
            status: won ? "won" : "lost",
            payout,
            settledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(bets.id, b.id))
          .run();

        tx.update(users)
          .set({ points: sql`${users.points} + ${payout}` })
          .where(eq(users.id, b.userId))
          .run();
      });

      settled++;
    }
  }

  return settled;
}
