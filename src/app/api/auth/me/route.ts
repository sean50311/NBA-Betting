import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/session-server";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ user: null });
  }

  const rows = await db.select().from(users).where(eq(users.id, uid));
  const u = rows[0];
  if (!u) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      avatarDataUrl: u.avatarDataUrl,
      points: u.points,
    },
  });
}
