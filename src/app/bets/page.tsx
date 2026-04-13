"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";

type Hist = {
  id: number;
  gameId: number;
  stake: number;
  odds: number;
  round: number;
  status: string;
  payout: number | null;
  pickedTeamId: number;
  game: {
    date: string;
    home_team: { id: number; full_name: string; abbreviation: string };
    visitor_team: { id: number; full_name: string; abbreviation: string };
    home_team_score: number | null;
    visitor_team_score: number | null;
    status: string | null;
  } | null;
};

type Stats = {
  totalBets: number;
  pending: number;
  settled: number;
  wins: number;
  losses: number;
  winRate: number;
  netPoints: number;
};

export default function BetsPage() {
  const [bets, setBets] = useState<Hist[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetch("/api/bets/history"), fetch("/api/bets/stats")])
      .then(async ([h, s]) => {
        if (h.status === 401 || s.status === 401) {
          window.location.href = "/login";
          return;
        }
        const hj = await h.json();
        const sj = await s.json();
        if (!h.ok) setErr(hj.error);
        setBets(hj.bets ?? []);
        setStats(sj);
      })
      .catch(() => setErr("載入失敗"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-white">我的下注</h1>

        {stats && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">總筆數</p>
              <p className="text-2xl font-semibold tabular-nums">{stats.totalBets}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">勝 / 負（已結算）</p>
              <p className="text-2xl font-semibold tabular-nums">
                {stats.wins} / {stats.losses}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">勝率</p>
              <p className="text-2xl font-semibold tabular-nums">
                {(stats.winRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-500">淨積分（已結算）</p>
              <p
                className={`text-2xl font-semibold tabular-nums ${
                  stats.netPoints >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {stats.netPoints > 0 ? "+" : ""}
                {stats.netPoints}
              </p>
            </div>
          </div>
        )}

        {err && <p className="mt-4 text-red-400">{err}</p>}

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500">
                <th className="pb-2 pr-2">日期</th>
                <th className="pb-2 pr-2">對戰</th>
                <th className="pb-2 pr-2">下注</th>
                <th className="pb-2 pr-2">賠率</th>
                <th className="pb-2 pr-2">結果</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((b) => {
                const g = b.game;
                const label = g
                  ? `${g.visitor_team.abbreviation} @ ${g.home_team.abbreviation}`
                  : `場次 #${b.gameId}`;
                const side =
                  g && b.pickedTeamId === g.home_team.id ? g.home_team.abbreviation : g?.visitor_team.abbreviation;
                return (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="py-3 align-top text-zinc-400">{g?.date ?? "—"}</td>
                    <td className="py-3 align-top">{label}</td>
                    <td className="py-3 align-top tabular-nums">
                      {b.stake} 分 · {side}
                    </td>
                    <td className="py-3 align-top tabular-nums">{b.odds}x</td>
                    <td className="py-3 align-top">
                      {b.status === "pending" && <span className="text-amber-300">未結算</span>}
                      {b.status === "won" && (
                        <span className="text-emerald-400">贏 · +{b.payout ?? 0} 返還</span>
                      )}
                      {b.status === "lost" && <span className="text-zinc-500">輸</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {bets.length === 0 && !err && <p className="mt-8 text-center text-zinc-500">尚無下注紀錄</p>}
      </main>
    </div>
  );
}
