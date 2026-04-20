import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/session-server";
import { displayPoints, pendingStakeSumForUser } from "@/lib/display-points";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const MAX_AVATAR = 450_000;

export async function PATCH(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) {
    return NextResponse.json({ error: "請先登入" }, { status: 401 });
  }

  const body = await req.json();
  const nickname =
    body.nickname !== undefined ? String(body.nickname).trim().slice(0, 64) : undefined;
  let avatarDataUrl: string | null | undefined =
    body.avatarDataUrl !== undefined ? String(body.avatarDataUrl) : undefined;

  if (avatarDataUrl && avatarDataUrl.length > MAX_AVATAR) {
    return NextResponse.json({ error: "大頭照過大，請選較小的圖片" }, { status: 400 });
  }
  if (avatarDataUrl === "") avatarDataUrl = null;

  if (nickname !== undefined && nickname.length < 1) {
    return NextResponse.json({ error: "暱稱不可為空" }, { status: 400 });
  }

  const patch: Partial<typeof users.$inferInsert> = {};
  if (nickname !== undefined) patch.nickname = nickname;
  if (avatarDataUrl !== undefined) patch.avatarDataUrl = avatarDataUrl;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "沒有要更新的欄位" }, { status: 400 });
  }

  await db.update(users).set(patch).where(eq(users.id, uid));

  const rows = await db.select().from(users).where(eq(users.id, uid));
  const u = rows[0]!;
  const pending = await pendingStakeSumForUser(uid);

  return NextResponse.json({
    user: {
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      avatarDataUrl: u.avatarDataUrl,
      points: displayPoints(u.points, pending),
      availablePoints: u.points,
    },
  });
}
