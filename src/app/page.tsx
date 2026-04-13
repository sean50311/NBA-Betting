"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BetModal, type GameRow } from "@/components/BetModal";
import {
  addDaysToYmd,
  gameDayYmd,
  pickDefaultViewDate,
  weekdayLabelZh,
} from "@/lib/date-utils";

type Me = { points: number } | null;

export default function Home() {
  const [allGames, setAllGames] = useState<GameRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [modalGame, setModalGame] = useState<GameRow | null>(null);

  const loadGames = useCallback(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.games?.length) setMsg(d.error);
        else setMsg(null);
        const list = (d.games ?? []) as GameRow[];
        setAllGames(list);
        setSeason(d.season ?? null);
        const days = [...new Set(list.map((g) => gameDayYmd(g)))].sort();
        setSelectedDate((prev) => {
          if (list.length === 0) return null;
          if (prev && days.includes(prev)) return prev;
          return pickDefaultViewDate(days);
        });
      })
      .catch(() => setMsg("無法載入賽事"));
  }, []);

  const loadMe = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user ? { points: d.user.points } : null))
      .catch(() => setMe(null));
  }, []);

  useEffect(() => {
    loadGames();
    loadMe();
  }, [loadGames, loadMe]);

  const games = useMemo(() => {
    if (!selectedDate) return [];
    return allGames
      .filter((g) => gameDayYmd(g) === selectedDate)
      .sort((a, b) => {
        const ta = a.datetime || a.date;
        const tb = b.datetime || b.date;
        return ta.localeCompare(tb);
      });
  }, [allGames, selectedDate]);

  const dateTitle = selectedDate
    ? `${selectedDate.replaceAll("-", "/")}（${weekdayLabelZh(selectedDate)}）`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">季後賽賽程</h1>
          <p className="mt-1 text-sm text-zinc-400">
            資料來源：{" "}
            <a
              className="text-orange-400 underline"
              href="https://www.balldontlie.io/openapi/nba.yml"
              target="_blank"
              rel="noreferrer"
            >
              BallDontLie NBA API
            </a>
            {season != null ? ` · 球季 ${season}` : null}
          </p>
        </div>

        {msg && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {msg}
          </div>
        )}

        {selectedDate && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                onClick={() => setSelectedDate((d) => (d ? addDaysToYmd(d, -1) : d))}
              >
                ← 前一天
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                onClick={() => setSelectedDate((d) => (d ? addDaysToYmd(d, 1) : d))}
              >
                後一天 →
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-medium text-white tabular-nums">{dateTitle}</span>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                跳轉
                <input
                  type="date"
                  className="rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-zinc-100"
                  value={selectedDate}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) setSelectedDate(v);
                  }}
                />
              </label>
            </div>
          </div>
        )}

        <ul className="space-y-3">
          {games.map((g) => (
            <li
              key={g.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs text-zinc-500">
                  {g.datetime ? new Date(g.datetime).toLocaleString("zh-TW") : g.date} · {g.roundLabel}{" "}
                  · 賠率 {g.odds}x
                </p>
                <p className="mt-1 text-lg font-medium text-white">
                  <span className="text-zinc-300">{g.visitor_team.full_name}</span>
                  <span className="mx-2 text-zinc-600">@</span>
                  <span>{g.home_team.full_name}</span>
                </p>
                {g.isFinal && (
                  <p className="mt-1 text-sm text-zinc-400">
                    完場比分 {g.visitor_team_score ?? "—"} : {g.home_team_score ?? "—"}
                  </p>
                )}
                {g.myBet && (
                  <p className="mt-2 text-sm text-orange-200/90">
                    我的下注：{g.myBet.stake} 分 · 選{" "}
                    {g.myBet.pickedTeamId === g.home_team.id ? g.home_team.abbreviation : g.visitor_team.abbreviation}{" "}
                    · {g.myBet.status === "pending" ? "未結算" : g.myBet.status === "won" ? "贏" : "輸"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {g.canBet && me && (
                  <button
                    type="button"
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-black hover:bg-orange-400"
                    onClick={() => setModalGame(g)}
                  >
                    {g.myBet ? "更改下注" : "下注"}
                  </button>
                )}
                {g.canBet && !me && (
                  <span className="text-xs text-zinc-500">登入後可下注</span>
                )}
                {!g.canBet && <span className="text-xs text-zinc-500">已開賽或完場</span>}
              </div>
            </li>
          ))}
        </ul>

        {allGames.length === 0 && !msg && (
          <p className="text-center text-zinc-500">目前沒有季後賽資料，或賽季尚未開始。</p>
        )}
        {allGames.length > 0 && selectedDate && games.length === 0 && !msg && (
          <p className="text-center text-zinc-500">這一天沒有季後賽賽事。</p>
        )}
      </main>

      <BetModal
        game={modalGame}
        open={!!modalGame}
        onClose={() => setModalGame(null)}
        points={me?.points ?? 0}
        onSaved={() => {
          loadGames();
          loadMe();
          window.dispatchEvent(new CustomEvent("nba-refresh-user"));
        }}
      />
    </div>
  );
}
