import type { Bet, User } from "@/db/schema";
import { INITIAL_POINTS } from "@/lib/bets-service";

/** 積分走勢圖專用：日界與橫軸標籤以台北時區為準（與賽程顯示無關） */
const CHART_TZ = "Asia/Taipei";

type MoneyEvent = { t: number; userId: number; delta: number };

const CHART_COLORS = [
  "#f97316",
  "#38bdf8",
  "#a78bfa",
  "#4ade80",
  "#f472b6",
  "#facc15",
  "#2dd4bf",
  "#fb7185",
  "#818cf8",
  "#c084fc",
  "#34d399",
  "#fdba74",
];

export function chartColorForIndex(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

function ymdInTimeZone(d: Date, timeZone: string): string {
  return d.toLocaleDateString("en-CA", { timeZone });
}

function ymdTaipei(d: Date): string {
  return ymdInTimeZone(d, CHART_TZ);
}

function todayYmdTaipei(): string {
  return ymdTaipei(new Date());
}

/** 台北該曆日結束瞬間（毫秒），供與事件時間戳比較 */
function endOfTaipeiDayMs(ymd: string): number {
  return Date.parse(`${ymd}T23:59:59.999+08:00`);
}

function addOneDayYmdTaipei(ymd: string): string {
  const ms = Date.parse(`${ymd}T12:00:00+08:00`);
  return ymdTaipei(new Date(ms + 86400000));
}

function eachDayInclusiveTaipei(fromYmd: string, toYmd: string): string[] {
  const out: string[] = [];
  let cur = fromYmd;
  for (;;) {
    out.push(cur);
    if (cur >= toYmd) break;
    cur = addOneDayYmdTaipei(cur);
  }
  return out;
}

function buildEvents(users: User[], bets: Bet[]): MoneyEvent[] {
  const ev: MoneyEvent[] = [];

  for (const u of users) {
    ev.push({
      t: u.createdAt.getTime(),
      userId: u.id,
      delta: INITIAL_POINTS,
    });
  }

  for (const b of bets) {
    ev.push({
      t: b.updatedAt.getTime(),
      userId: b.userId,
      delta: -b.stake,
    });
    if (b.status === "won" || b.status === "lost") {
      const pay = b.payout ?? 0;
      if (b.settledAt) {
        ev.push({
          t: b.settledAt.getTime(),
          userId: b.userId,
          delta: pay,
        });
      }
    }
  }

  ev.sort((a, b) => a.t - b.t);
  return ev;
}

function eventsForUser(userId: number, events: MoneyEvent[]): MoneyEvent[] {
  return events.filter((e) => e.userId === userId).sort((a, b) => a.t - b.t);
}

/** 每日台北日結束時點餘額；註冊日前為 null */
function balanceSeriesForUser(
  user: User,
  userEvents: MoneyEvent[],
  days: string[]
): (number | null)[] {
  const firstDay = ymdTaipei(user.createdAt);
  const sorted = [...userEvents].sort((a, b) => a.t - b.t);
  let i = 0;
  let bal = 0;
  const out: (number | null)[] = [];

  for (const day of days) {
    if (day < firstDay) {
      out.push(null);
      continue;
    }
    const endT = endOfTaipeiDayMs(day);
    while (i < sorted.length && sorted[i].t <= endT) {
      bal += sorted[i].delta;
      i++;
    }
    out.push(bal);
  }

  return out;
}

export type PointsHistoryResult = {
  dates: string[];
  series: {
    userId: number;
    nickname: string;
    color: string;
    points: (number | null)[];
  }[];
};

/**
 * 依註冊、下注（依 updatedAt 扣目前 stake）、結算（settledAt 加 payout）重建每日餘額。
 * 最後一日會依 actualEndPoints 校正（避免 stake 曾修改造成與 DB 小幅落差）。
 */
export function buildPointsHistory(
  users: User[],
  bets: Bet[],
  actualEndPoints: Map<number, number>
): PointsHistoryResult {
  if (users.length === 0) {
    return { dates: [], series: [] };
  }

  const events = buildEvents(users, bets);
  const byUser = new Map<number, MoneyEvent[]>();
  for (const u of users) {
    byUser.set(u.id, eventsForUser(u.id, events));
  }

  const today = todayYmdTaipei();
  let minDay = today;
  for (const u of users) {
    const d = ymdTaipei(u.createdAt);
    if (d < minDay) minDay = d;
  }
  const days = eachDayInclusiveTaipei(minDay, today);

  const series = users.map((u, idx) => {
    const pts = balanceSeriesForUser(u, byUser.get(u.id) ?? [], days);
    const actual = actualEndPoints.get(u.id);
    if (actual != null && pts.length > 0) {
      const last = pts.length - 1;
      pts[last] = actual;
    }
    return {
      userId: u.id,
      nickname: u.nickname,
      color: chartColorForIndex(idx),
      points: pts,
    };
  });

  return { dates: days, series };
}
