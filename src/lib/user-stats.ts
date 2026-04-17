import type { Bet } from "@/db/schema";

export type BetStats = {
  wins: number;
  losses: number;
  pending: number;
  totalBets: number;
  winRate: number;
};

export function aggregateBetStats(rows: Pick<Bet, "userId" | "status">[]): Map<number, BetStats> {
  const map = new Map<number, { wins: number; losses: number; pending: number }>();

  for (const b of rows) {
    let e = map.get(b.userId);
    if (!e) {
      e = { wins: 0, losses: 0, pending: 0 };
      map.set(b.userId, e);
    }
    if (b.status === "won") e.wins++;
    else if (b.status === "lost") e.losses++;
    else if (b.status === "pending") e.pending++;
  }

  const out = new Map<number, BetStats>();
  for (const [uid, e] of map) {
    const settled = e.wins + e.losses;
    const totalBets = settled + e.pending;
    const winRate = settled > 0 ? e.wins / settled : 0;
    out.set(uid, {
      wins: e.wins,
      losses: e.losses,
      pending: e.pending,
      totalBets,
      winRate,
    });
  }
  return out;
}

export function emptyStats(): BetStats {
  return {
    wins: 0,
    losses: 0,
    pending: 0,
    totalBets: 0,
    winRate: 0,
  };
}
