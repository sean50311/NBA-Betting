import { and, eq, sum } from "drizzle-orm";
import { db } from "@/db";
import { bets } from "@/db/schema";

/** 顯示用總積分：錢包餘額 + 尚未結算的下注金額（比賽結束前數字不因下注而減少） */
export function displayPoints(availablePoints: number, pendingStakeSum: number): number {
  return availablePoints + pendingStakeSum;
}

export async function pendingStakeSumForUser(userId: number): Promise<number> {
  const rows = await db
    .select({ total: sum(bets.stake) })
    .from(bets)
    .where(and(eq(bets.userId, userId), eq(bets.status, "pending")));
  const t = rows[0]?.total;
  return t == null ? 0 : Number(t);
}

/** 每位使用者未結算下注加總（僅 pending） */
export async function pendingStakeSumByUser(): Promise<Map<number, number>> {
  const rows = await db
    .select({
      userId: bets.userId,
      total: sum(bets.stake),
    })
    .from(bets)
    .where(eq(bets.status, "pending"))
    .groupBy(bets.userId);

  const m = new Map<number, number>();
  for (const r of rows) {
    m.set(r.userId, r.total == null ? 0 : Number(r.total));
  }
  return m;
}
