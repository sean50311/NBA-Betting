import type { NBAGame } from "./nba-types";

/** 比賽是否已結束（可結算） */
export function gameIsFinal(game: NBAGame): boolean {
  const s = (game.status || "").toLowerCase();
  if (s.includes("final")) return true;
  const pd = (game.period_detail || "").toLowerCase();
  if (pd.includes("final")) return true;
  return false;
}

/** 比賽是否已開打（不可再下注／修改） */
export function gameHasStarted(game: NBAGame): boolean {
  if (gameIsFinal(game)) return true;
  if (game.period != null && game.period > 0) return true;
  const s = (game.status || "").toLowerCase();
  if (s.includes("live") || s.includes("progress") || s.includes("qtr") || s.includes("half")) {
    return true;
  }
  if (game.datetime) {
    return new Date(game.datetime).getTime() <= Date.now();
  }
  if (game.date && game.time) {
    const iso = `${game.date}T${normalizeTime(game.time)}`;
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t <= Date.now();
  }
  return false;
}

function normalizeTime(t: string): string {
  if (/^\d{2}:\d{2}/.test(t)) return t.length === 5 ? `${t}:00` : t;
  return "23:59:59";
}

export function winnerTeamId(game: NBAGame): number | null {
  if (!gameIsFinal(game)) return null;
  const hs = game.home_team_score;
  const vs = game.visitor_team_score;
  if (hs == null || vs == null) return null;
  if (hs === vs) return null;
  return hs > vs ? game.home_team.id : game.visitor_team.id;
}
