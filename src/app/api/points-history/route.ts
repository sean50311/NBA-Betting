import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, bets } from "@/db/schema";
import { buildPointsHistory } from "@/lib/points-history";
import { displayPoints, pendingStakeSumByUser } from "@/lib/display-points";

export const runtime = "nodejs";

export async function GET() {
  const [userRows, betRows] = await Promise.all([
    db.select().from(users),
    db.select().from(bets),
  ]);

  const pendingByUser = await pendingStakeSumByUser();
  const actualEndPoints = new Map<number, number>();
  for (const u of userRows) {
    const pending = pendingByUser.get(u.id) ?? 0;
    actualEndPoints.set(u.id, displayPoints(u.points, pending));
  }

  const data = buildPointsHistory(userRows, betRows, actualEndPoints);
  return NextResponse.json(data);
}
