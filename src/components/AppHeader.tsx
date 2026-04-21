"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function BarChartIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} aria-hidden>
      <rect x="3" y="10" width="4.5" height="9" rx="1" />
      <rect x="9.75" y="6" width="4.5" height="13" rx="1" />
      <rect x="16.5" y="13" width="4.5" height="6" rx="1" />
    </svg>
  );
}

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
          <Link href="/leaderboard" className="text-zinc-300 hover:text-white">
            排行榜
          </Link>
          <Link
            href="/points-trend"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
            title="積分走勢"
            aria-label="積分走勢"
          >
            <BarChartIcon className="h-5 w-5" />
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
