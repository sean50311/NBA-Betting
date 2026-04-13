/**
 * BallDontLie 的賽事沒有「季後賽輪次」欄位，因此以比賽日期落在哪個區間來決定輪次與賠率。
 * 每年季後賽開打後請依實際賽程調整下列邊界日期（皆為當地比賽日 YYYY-MM-DD，依 API 的 game.date）。
 *
 * 輪次：第一輪 → 第二輪 → 分區冠軍 → 總冠軍
 * 賠率（十進位小數，贏家總返還 = stake × 賠率）：1, 1.5, 2, 3
 */
export const ROUND_ODDS = [1, 1.5, 2, 3] as const;

/** 預設以 2025–26 季後賽常見時程為範例；可透過環境變數覆寫 */
function boundaryDates() {
  return {
    r1End: process.env.PLAYOFF_R1_END ?? "2026-05-06",
    r2End: process.env.PLAYOFF_R2_END ?? "2026-05-21",
    r3End: process.env.PLAYOFF_R3_END ?? "2026-06-08",
  };
}

export function playoffRoundFromDate(gameDate: string): 1 | 2 | 3 | 4 {
  const day = gameDate.slice(0, 10);
  const { r1End, r2End, r3End } = boundaryDates();
  if (day <= r1End) return 1;
  if (day <= r2End) return 2;
  if (day <= r3End) return 3;
  return 4;
}

export function oddsForRound(round: 1 | 2 | 3 | 4): number {
  return ROUND_ODDS[round - 1];
}

/** 賠率以「萬分之一」整數存進 DB，避免浮點誤差 */
export function oddsToBps(odds: number): number {
  return Math.round(odds * 10000);
}

export function bpsToOdds(bps: number): number {
  return bps / 10000;
}
