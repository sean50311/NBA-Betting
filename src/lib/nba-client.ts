import type { GamesResponse, NBAGame } from "./nba-types";

const BASE = "https://api.balldontlie.io/nba/v1";

function getApiKey(): string | null {
  const k = process.env.BALLDONTLIE_API_KEY;
  return k && k.trim() ? k.trim() : null;
}

export function hasNbaApiKey(): boolean {
  return !!getApiKey();
}

/** 與 `/api/games` 相同預設球季（BallDontLie `seasons[]`） */
export function nbaSeasonFromEnv(): number {
  const s = process.env.NBA_SEASON;
  if (s && /^\d+$/.test(s)) return parseInt(s, 10);
  return 2025;
}

/**
 * 下注／驗證用：先打單場 API；若失敗（部分場次單場端回 404 但列表仍有），改從季後賽列表尋找。
 * 一律略過快取，避免與賽程頁不一致。
 */
export async function fetchGameForBetting(id: number): Promise<NBAGame | null> {
  const direct = await fetchGameById(id, { noCache: true });
  if (direct) return direct;

  const all = await fetchAllPlayoffGames(nbaSeasonFromEnv(), { noCache: true });
  return all.find((g) => g.id === id) ?? null;
}

export async function fetchAllPlayoffGames(
  season: number,
  options?: { noCache?: boolean }
): Promise<NBAGame[]> {
  const key = getApiKey();
  if (!key) return [];

  const all: NBAGame[] = [];
  let cursor: number | undefined;

  for (;;) {
    const params = new URLSearchParams();
    params.set("postseason", "true");
    params.append("seasons[]", String(season));
    params.set("per_page", "100");
    if (cursor != null) params.set("cursor", String(cursor));

    const res = await fetch(`${BASE}/games?${params.toString()}`, {
      headers: { Authorization: key },
      ...(options?.noCache
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NBA API ${res.status}: ${err.slice(0, 200)}`);
    }

    const body = (await res.json()) as GamesResponse;
    all.push(...body.data);
    if (body.meta.next_cursor == null) break;
    cursor = body.meta.next_cursor;
  }

  all.sort((a, b) => {
    const ta = a.datetime || a.date;
    const tb = b.datetime || b.date;
    return ta.localeCompare(tb);
  });

  return all;
}

export async function fetchGameById(
  id: number,
  options?: { noCache?: boolean }
): Promise<NBAGame | null> {
  const key = getApiKey();
  if (!key) return null;

  const res = await fetch(`${BASE}/games/${id}`, {
    headers: { Authorization: key },
    ...(options?.noCache
      ? { cache: "no-store" as const }
      : { next: { revalidate: 30 } }),
  });

  if (!res.ok) return null;
  const body = (await res.json()) as { data: NBAGame };
  return body.data;
}
