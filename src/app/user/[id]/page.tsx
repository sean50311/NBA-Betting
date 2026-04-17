"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";

type PublicUser = {
  id: number;
  nickname: string;
  avatarDataUrl: string | null;
  points: number;
  createdAt: string;
  wins: number;
  losses: number;
  pending: number;
  totalBets: number;
  winRate: number;
};

export default function PublicUserPage() {
  const params = useParams();
  const idStr = params.id as string;
  const [user, setUser] = useState<PublicUser | null>(null);
  const [meId, setMeId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMeId(d.user?.id ?? null))
      .catch(() => setMeId(null));
  }, []);

  useEffect(() => {
    if (!idStr) return;
    setErr(null);
    fetch(`/api/users/${idStr}`)
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.error ?? "載入失敗")));
        return r.json();
      })
      .then((d) => setUser(d.user))
      .catch((e) => {
        setUser(null);
        setErr(e instanceof Error ? e.message : "載入失敗");
      });
  }, [idStr]);

  const isSelf = meId != null && user?.id === meId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-lg px-4 py-10">
        <p className="text-sm text-zinc-500">
          <Link href="/leaderboard" className="text-orange-400 hover:underline">
            ← 返回排行榜
          </Link>
        </p>

        {err && <p className="mt-6 text-center text-red-400">{err}</p>}

        {user && (
          <>
            <div className="mt-6 flex flex-col items-center text-center">
              {user.avatarDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarDataUrl}
                  alt=""
                  className="h-28 w-28 rounded-full border border-white/15 object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-zinc-800 text-4xl text-zinc-400">
                  {user.nickname.slice(0, 1)}
                </div>
              )}
              <h1 className="mt-4 text-2xl font-bold text-white">{user.nickname}</h1>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-orange-300">{user.points} 分</p>
              <p className="mt-2 text-xs text-zinc-500">
                加入時間 {new Date(user.createdAt).toLocaleDateString("zh-TW")}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-zinc-500">勝</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">{user.wins}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-zinc-500">負</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-400">{user.losses}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-zinc-500">勝率</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-200">
                  {user.wins + user.losses > 0 ? `${(user.winRate * 100).toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-xs text-zinc-500">未結算</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-amber-400/90">{user.pending}</p>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-zinc-500">
              總下注筆數 {user.totalBets}（含未結算）
            </p>

            {isSelf && (
              <div className="mt-8 flex justify-center">
                <Link
                  href="/profile"
                  className="rounded-lg border border-white/20 px-5 py-2 text-sm text-zinc-200 hover:bg-white/5"
                >
                  編輯我的個人資料
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
