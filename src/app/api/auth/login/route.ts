import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword, signSession, COOKIE } from "@/lib/auth";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    const rows = await db.select().from(users).where(eq(users.username, username));
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
    }

    const token = await signSession(user.id);
    const res = NextResponse.json({ ok: true, userId: user.id });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "登入失敗";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
