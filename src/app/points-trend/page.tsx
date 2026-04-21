"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PointsTrendChart, type SeriesRow } from "@/components/PointsTrendChart";

type Payload = {
  dates: string[];
  series: SeriesRow[];
};

export default function PointsTrendPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/points-history")
      .then((r) => r.json())
      .then((d) => {
        if (!d.dates || !d.series) setErr("無法載入資料");
        else setData({ dates: d.dates, series: d.series });
      })
      .catch(() => setErr("無法載入資料"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">積分走勢</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          橫軸為日期（台北時區日界），縱軸為顯示積分（錢包餘額＋未結算下注）。走勢依註冊、下注與結算紀錄重建，最後一日與目前顯示積分對齊。
        </p>

        {err && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {err}
          </p>
        )}

        {!err && !data && (
          <p className="mt-12 text-center text-zinc-500">載入中…</p>
        )}

        {data && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
            <PointsTrendChart dates={data.dates} series={data.series} />
          </div>
        )}
      </main>
    </div>
  );
}
