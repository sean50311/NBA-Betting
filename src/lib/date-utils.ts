/** 本地日曆日的 YYYY-MM-DD */
export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocalYmd(): string {
  return formatLocalYmd(new Date());
}

/** 從 YYYY-MM-DD 加減天數（本地時區） */
export function addDaysToYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  return formatLocalYmd(dt);
}

/** 從 API 的 date / datetime 取出 YYYY-MM-DD */
export function gameDayYmd(game: { date: string; datetime: string | null }): string {
  if (game.date) {
    const s = game.date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }
  if (game.datetime) {
    return game.datetime.slice(0, 10);
  }
  return game.date.slice(0, 10);
}

/**
 * 預設顯示日：若今天有賽事則今天；否則選「今天之後最近一天」；
 * 若皆已過去則選排程中「最後一天」（最近已結束區間）。
 */
export function pickDefaultViewDate(sortedUniqueYmds: string[]): string | null {
  if (sortedUniqueYmds.length === 0) return null;
  const today = todayLocalYmd();
  const firstOnOrAfter = sortedUniqueYmds.find((d) => d >= today);
  if (firstOnOrAfter) return firstOnOrAfter;
  return sortedUniqueYmds[sortedUniqueYmds.length - 1];
}

export function weekdayLabelZh(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const w = ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()];
  return `週${w}`;
}
