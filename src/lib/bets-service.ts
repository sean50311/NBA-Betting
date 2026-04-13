import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { bets, users } from "@/db/schema";
import { fetchGameById } from "./nba-client";
import { gameHasStarted } from "./game-state";
import {
  oddsForRound,
  oddsToBps,
  playoffRoundFromDate,
} from "@/config/playoff";

export const INITIAL_POINTS = 1000;

export async function placeOrUpdateBet(
  userId: number,
  gameId: number,
  pickedTeamId: number,
  stake: number
) {
  if (stake < 0) throw new Error("下注金額無效");
  if (stake > 0 && stake < 1) throw new Error("下注至少 1 分");

  const game = await fetchGameById(gameId);
  if (!game) throw new Error("找不到比賽");
  if (!game.postseason) throw new Error("僅限季後賽場次");

  if (gameHasStarted(game)) throw new Error("比賽已開始或結束，無法下注");

  const homeId = game.home_team.id;
  const awayId = game.visitor_team.id;
  if (pickedTeamId !== homeId && pickedTeamId !== awayId) {
    throw new Error("必須選擇主隊或客隊");
  }

  const round = playoffRoundFromDate(game.date);
  const odds = oddsForRound(round);
  const oddsBps = oddsToBps(odds);

  db.transaction((tx) => {
    const existingRows = tx
      .select()
      .from(bets)
      .where(and(eq(bets.userId, userId), eq(bets.gameId, gameId)))
      .all();
    const existing = existingRows[0];

    const userRows = tx.select().from(users).where(eq(users.id, userId)).all();
    const row = userRows[0];
    if (!row) throw new Error("使用者不存在");

    if (stake === 0) {
      if (!existing) return;
      tx.update(users)
        .set({ points: sql`${users.points} + ${existing.stake}` })
        .where(eq(users.id, userId))
        .run();
      tx.delete(bets).where(eq(bets.id, existing.id)).run();
      return;
    }

    let balance = row.points;
    if (existing) balance += existing.stake;
    if (balance < stake) throw new Error("積分不足");

    if (existing) {
      tx.update(users)
        .set({ points: sql`${users.points} + ${existing.stake} - ${stake}` })
        .where(eq(users.id, userId))
        .run();

      tx.update(bets)
        .set({
          pickedTeamId,
          stake,
          odds: oddsBps,
          round,
          updatedAt: new Date(),
        })
        .where(eq(bets.id, existing.id))
        .run();
    } else {
      tx.update(users)
        .set({ points: sql`${users.points} - ${stake}` })
        .where(eq(users.id, userId))
        .run();

      tx.insert(bets)
        .values({
          userId,
          gameId,
          pickedTeamId,
          stake,
          odds: oddsBps,
          round,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .run();
    }
  });
}
