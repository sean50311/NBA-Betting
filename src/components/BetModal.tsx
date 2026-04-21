"use client";

import Link from "next/link";
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

type PublicBetRow = {
  betId: number;
  userId: number;
  nickname: string;
  avatarDataUrl: string | null;
  pickedTeamId: number;
  stake: number;
  odds: number;
  status: string;
  payout: number | null;
  createdAt: string;
};

type Props = {
  game: GameRow | null;
  open: boolean;
  /** 已開賽／完場：僅能檢視，無法下注或修改 */
  readOnly?: boolean;
  onClose: () => void;
  points: number;
  onSaved: () => void;
};

function sideLabel(pickedTeamId: number, game: GameRow) {
  if (pickedTeamId === game.home_team.id) return `主 ${game.home_team.abbreviation}`;
  return `客 ${game.visitor_team.abbreviation}`;
}

export function BetModal({ game, open, readOnly = false, onClose, points, onSaved }: Props) {
  const [teamId, setTeamId] = useState<number | "">("");
  const [stake, setStake] = useState<number | "">("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publicBets, setPublicBets] = useState<PublicBetRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!game || !open) return;
    setErr(null);
    if (readOnly) {
      if (game.myBet) {
        setTeamId(game.myBet.pickedTeamId);
        setStake(game.myBet.stake);
      } else {
        setTeamId("");
        setStake("");
      }
      return;
    }
    if (game.myBet) {
      setTeamId(game.myBet.pickedTeamId);
      setStake(game.myBet.stake);
    } else {
      setTeamId(game.home_team.id);
      setStake(10);
    }
  }, [game, open, readOnly]);

  useEffect(() => {
    if (!game || !open) {
      setPublicBets([]);
      return;
    }
    setLoadingList(true);
    fetch(`/api/games/${game.id}/bets`)
      .then((r) => r.json())
      .then((d) => setPublicBets(Array.isArray(d.bets) ? d.bets : []))
      .catch(() => setPublicBets([]))
      .finally(() => setLoadingList(false));
  }, [game, open]);

  if (!open || !game) return null;

  async function submit() {
    if (readOnly || !game) return;
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
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-zinc-900 shadow-xl">
        <div className="overflow-y-auto p-6">
          <h2 className="text-lg font-semibold text-white">{readOnly ? "下注情況" : "下注"}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {game.visitor_team.full_name} @ {game.home_team.full_name}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {game.roundLabel} · 賠率 {game.odds}x（贏家總返還 = 下注 × 賠率）
          </p>

          {readOnly && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
              比賽已開打或已結束，無法新增或修改下注；以下為檢視用。
            </p>
          )}

          <div className="mt-4 space-y-3">
            {readOnly && !game.myBet ? (
              <p className="text-sm text-zinc-400">你未下注這場。</p>
            ) : (
              <>
                <div>
                  <label className="text-xs text-zinc-400">選擇隊伍</label>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => !readOnly && setTeamId(game.visitor_team.id)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                        teamId === game.visitor_team.id
                          ? "border-orange-500 bg-orange-500/20 text-orange-200"
                          : "border-white/10 text-zinc-300 hover:bg-white/5"
                      } ${readOnly ? "cursor-default opacity-90" : ""}`}
                    >
                      客 {game.visitor_team.abbreviation}
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => !readOnly && setTeamId(game.home_team.id)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                        teamId === game.home_team.id
                          ? "border-orange-500 bg-orange-500/20 text-orange-200"
                          : "border-white/10 text-zinc-300 hover:bg-white/5"
                      } ${readOnly ? "cursor-default opacity-90" : ""}`}
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
                    max={readOnly ? undefined : maxStake}
                    readOnly={readOnly}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white read-only:cursor-default read-only:text-zinc-300"
                    value={stake === "" ? "" : stake}
                    onChange={(e) => {
                      if (readOnly) return;
                      const v = e.target.value;
                      if (v === "") setStake("");
                      else setStake(parseInt(v, 10) || 0);
                    }}
                  />
                  {!readOnly && (
                    <p className="mt-1 text-xs text-zinc-500">
                      可用約 {maxStake} 分（含退回原下注）
                    </p>
                  )}
                  {readOnly && game.myBet && (
                    <p className="mt-2 text-xs text-zinc-500">
                      狀態：
                      {game.myBet.status === "pending" && "未結算"}
                      {game.myBet.status === "won" && <span className="text-emerald-400"> 贏</span>}
                      {game.myBet.status === "lost" && <span> 輸</span>}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {!readOnly && err && <p className="mt-3 text-sm text-red-400">{err}</p>}

          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-sm font-medium text-zinc-300">本場下注玩家</h3>
            <p className="mt-1 text-xs text-zinc-500">暱稱與下注內容公開；點暱稱可查看該玩家主頁。</p>
            {loadingList ? (
              <p className="mt-4 text-sm text-zinc-500">載入中…</p>
            ) : publicBets.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">尚無人下注這場。</p>
            ) : (
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {publicBets.map((b) => (
                  <li
                    key={b.betId}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/user/${b.userId}`}
                      className="flex min-w-0 flex-1 items-center gap-2 text-orange-300 hover:underline"
                      onClick={onClose}
                    >
                      {b.avatarDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.avatarDataUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs">
                          {b.nickname.slice(0, 1)}
                        </span>
                      )}
                      <span className="truncate font-medium text-white">{b.nickname}</span>
                    </Link>
                    <span className="tabular-nums text-zinc-400">
                      {sideLabel(b.pickedTeamId, game)} · {b.stake} 分 · {b.odds}x
                    </span>
                    <span className="text-xs text-zinc-500">
                      {b.status === "pending" && "未結算"}
                      {b.status === "won" && <span className="text-emerald-400">贏</span>}
                      {b.status === "lost" && <span className="text-zinc-500">輸</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
            {readOnly ? (
              <button
                type="button"
                className="rounded-lg bg-zinc-700 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-600"
                onClick={onClose}
              >
                關閉
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
