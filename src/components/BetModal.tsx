"use client";

import { useEffect, useState } from "react";

export type GameRow = {
  id: number;
  date: string;
  datetime: string | null;
  home_team: { id: number; full_name: string; abbreviation: string };
  visitor_team: { id: number; full_name: string; abbreviation: string };
  home_team_score?: number | null;
  visitor_team_score?: number | null;
  roundLabel: string;
  odds: number;
  canBet: boolean;
  isFinal?: boolean;
  myBet: { pickedTeamId: number; stake: number; odds: number; status: string } | null;
};

type Props = {
  game: GameRow | null;
  open: boolean;
  onClose: () => void;
  points: number;
  onSaved: () => void;
};

export function BetModal({ game, open, onClose, points, onSaved }: Props) {
  const [teamId, setTeamId] = useState<number | "">("");
  const [stake, setStake] = useState<number | "">("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!game || !open) return;
    setErr(null);
    if (game.myBet) {
      setTeamId(game.myBet.pickedTeamId);
      setStake(game.myBet.stake);
    } else {
      setTeamId(game.home_team.id);
      setStake(10);
    }
  }, [game, open]);

  if (!open || !game) return null;

  async function submit() {
    if (!game) return;
    setErr(null);
    const tid = typeof teamId === "number" ? teamId : 0;
    const s = typeof stake === "number" ? stake : 0;
    if (!tid) {
      setErr("請選擇隊伍");
      return;
    }
    if (s < 0) {
      setErr("金額無效");
      return;
    }
    setLoading(true);
    const g = game;
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: g.id, pickedTeamId: tid, stake: s }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "失敗");
        return;
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const maxStake = game.myBet ? points + game.myBet.stake : points;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">下注</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {game.visitor_team.full_name} @ {game.home_team.full_name}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {game.roundLabel} · 賠率 {game.odds}x（贏家總返還 = 下注 × 賠率）
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-400">選擇隊伍</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setTeamId(game.visitor_team.id)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  teamId === game.visitor_team.id
                    ? "border-orange-500 bg-orange-500/20 text-orange-200"
                    : "border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                客 {game.visitor_team.abbreviation}
              </button>
              <button
                type="button"
                onClick={() => setTeamId(game.home_team.id)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  teamId === game.home_team.id
                    ? "border-orange-500 bg-orange-500/20 text-orange-200"
                    : "border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                主 {game.home_team.abbreviation}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400">積分（0 = 取消下注）</label>
            <input
              type="number"
              min={0}
              max={maxStake}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              value={stake === "" ? "" : stake}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") setStake("");
                else setStake(parseInt(v, 10) || 0);
              }}
            />
            <p className="mt-1 text-xs text-zinc-500">
              可用約 {maxStake} 分（含退回原下注）
            </p>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-zinc-400 hover:bg-white/5"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading || !game.canBet}
            className="rounded-lg bg-orange-500 px-4 py-2 font-medium text-black disabled:opacity-40"
            onClick={() => void submit()}
          >
            {loading ? "送出中…" : "確認"}
          </button>
        </div>
      </div>
    </div>
  );
}
