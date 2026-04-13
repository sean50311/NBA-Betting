"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = {
  id: number;
  username: string;
  nickname: string;
  avatarDataUrl: string | null;
  points: number;
};

export function AppHeader() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  function load() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ?? null))
      .catch(() => setMe(null));
  }

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("nba-refresh-user", onRefresh);
    return () => window.removeEventListener("nba-refresh-user", onRefresh);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    window.location.href = "/";
  }

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight text-orange-400">
          NBA 季後賽積分下注
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/" className="text-zinc-300 hover:text-white">
            賽程
          </Link>
          <Link href="/bets" className="text-zinc-300 hover:text-white">
            我的下注
          </Link>
          {me === undefined ? (
            <span className="text-zinc-500">…</span>
          ) : me ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-zinc-200 hover:text-white">
                {me.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatarDataUrl} alt="" className="h-7 w-7 rounded-full object-cover border border-white/20" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs">
                    {me.nickname.slice(0, 1)}
                  </span>
                )}
                <span className="max-w-[8rem] truncate">{me.nickname}</span>
              </Link>
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-orange-300 tabular-nums">
                {me.points} 分
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg border border-white/15 px-2 py-1 text-zinc-300 hover:bg-white/5"
              >
                登出
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-300 hover:text-white">
                登入
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-orange-500 px-3 py-1.5 font-medium text-black hover:bg-orange-400"
              >
                註冊
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
