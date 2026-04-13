import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, signSession, COOKIE } from "@/lib/auth";
import { INITIAL_POINTS } from "@/lib/bets-service";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const nickname = String(body.nickname ?? username).trim() || username;

    if (username.length < 3 || username.length > 32) {
      return NextResponse.json({ error: "帳號長度須為 3–32 字元" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密碼至少 6 字元" }, { status: 400 });
    }

    const dup = db.select().from(users).where(eq(users.username, username)).all();
    if (dup.length > 0) {
      return NextResponse.json({ error: "此帳號已被使用" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const inserted = db
      .insert(users)
      .values({
        username,
        passwordHash,
        nickname,
        points: INITIAL_POINTS,
        createdAt: now,
      })
      .returning({ id: users.id })
      .all();

    const id = inserted[0]?.id;
    if (!id) throw new Error("註冊失敗");

    const token = await signSession(id);
    const res = NextResponse.json({ ok: true, userId: id });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "註冊失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
