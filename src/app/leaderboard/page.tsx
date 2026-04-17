"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";

type Row = {
  rank: number;
  id: number;
  nickname: string;
  avatarDataUrl: string | null;
  points: number;
  wins: number;
  losses: number;
  pending: number;
  totalBets: number;
  winRate: number;
};

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => {
        if (!d.leaderboard) setErr(d.error ?? "載入失敗");
        else setRows(d.leaderboard);
      })
      .catch(() => setErr("載入失敗"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">排行榜</h1>
        <p className="mt-1 text-sm text-zinc-400">依目前積分排序；點擊列可查看該使用者公開資料。</p>

        {err && <p className="mt-4 text-red-400">{err}</p>}

        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-zinc-400">
                <th className="px-3 py-3 font-medium">名次</th>
                <th className="px-3 py-3 font-medium">使用者</th>
                <th className="px-3 py-3 font-medium tabular-nums">積分</th>
                <th className="px-3 py-3 font-medium tabular-nums">勝</th>
                <th className="px-3 py-3 font-medium tabular-nums">負</th>
                <th className="px-3 py-3 font-medium tabular-nums">勝率</th>
                <th className="px-3 py-3 font-medium tabular-nums">未結算</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-3 tabular-nums text-zinc-300">{r.rank}</td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/user/${r.id}`}
                      className="flex items-center gap-2 text-orange-300 hover:text-orange-200 hover:underline"
                    >
                      {r.avatarDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.avatarDataUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full border border-white/15 object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs">
                          {r.nickname.slice(0, 1)}
                        </span>
                      )}
                      <span className="font-medium text-white">{r.nickname}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 tabular-nums text-orange-200">{r.points}</td>
                  <td className="px-3 py-3 tabular-nums text-emerald-400/90">{r.wins}</td>
                  <td className="px-3 py-3 tabular-nums text-zinc-500">{r.losses}</td>
                  <td className="px-3 py-3 tabular-nums text-zinc-300">
                    {r.wins + r.losses > 0 ? `${(r.winRate * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-3 tabular-nums text-amber-400/80">{r.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && !err && (
          <p className="mt-8 text-center text-zinc-500">尚無使用者資料。</p>
        )}
      </main>
    </div>
  );
}
