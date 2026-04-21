"use client";

import { useMemo, useState } from "react";

export type SeriesRow = {
  userId: number;
  nickname: string;
  color: string;
  points: (number | null)[];
};

type Props = {
  dates: string[];
  series: SeriesRow[];
};

const W = 920;
const H = 420;
const PAD = { top: 24, right: 28, bottom: 56, left: 56 };

export function PointsTrendChart({ dates, series }: Props) {
  const [hover, setHover] = useState<{
    idx: number;
    x: number;
    y: number;
  } | null>(null);

  const { innerW, innerH, minY, maxY, paths, xTicks, yTicks, scaleX, scaleY } = useMemo(() => {
    if (dates.length === 0 || series.length === 0) {
      return {
        innerW: 0,
        innerH: 0,
        minY: 0,
        maxY: 0,
        paths: [] as { userId: number; d: string; color: string }[],
        xTicks: [] as { idx: number; label: string }[],
        yTicks: [] as number[],
        scaleX: (_i: number) => 0,
        scaleY: (_v: number) => 0,
      };
    }

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const n = dates.length;

    let min = Infinity;
    let max = -Infinity;
    for (const s of series) {
      for (const p of s.points) {
        if (p != null) {
          min = Math.min(min, p);
          max = Math.max(max, p);
        }
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      min = 0;
      max = 1000;
    }
    if (min === max) {
      min -= 50;
      max += 50;
    }
    const padY = (max - min) * 0.06;
    min -= padY;
    max += padY;

    const scaleX = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const scaleY = (v: number) => PAD.top + innerH - ((v - min) / (max - min)) * innerH;

    const paths: { userId: number; d: string; color: string }[] = [];

    for (const s of series) {
      const parts: string[] = [];
      let penUp = true;
      for (let i = 0; i < s.points.length; i++) {
        const p = s.points[i];
        if (p == null) {
          penUp = true;
          continue;
        }
        const x = scaleX(i);
        const y = scaleY(p);
        if (penUp) {
          parts.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
          penUp = false;
        } else {
          parts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
      }
      if (parts.length) {
        paths.push({ userId: s.userId, d: parts.join(" "), color: s.color });
      }
    }

    const tickCount = 5;
    const yTicks: number[] = [];
    for (let t = 0; t < tickCount; t++) {
      yTicks.push(min + ((max - min) * t) / (tickCount - 1));
    }

    const xTickIdx: number[] = [];
    if (n <= 6) {
      for (let i = 0; i < n; i++) xTickIdx.push(i);
    } else {
      xTickIdx.push(0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1);
      const uniq = [...new Set(xTickIdx)].sort((a, b) => a - b);
      xTickIdx.length = 0;
      xTickIdx.push(...uniq);
    }

    const xTicks = xTickIdx.map((idx) => ({ idx, label: dates[idx] ?? "" }));

    return {
      innerW,
      innerH,
      minY: min,
      maxY: max,
      paths,
      xTicks,
      yTicks,
      scaleX,
      scaleY,
    };
  }, [dates, series]);

  if (dates.length === 0 || series.length === 0) {
    return <p className="text-center text-zinc-500">尚無資料</p>;
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const mx = ((e.clientX - r.left) / r.width) * W;
    if (mx < PAD.left || mx > W - PAD.right) {
      setHover(null);
      return;
    }
    const n = dates.length;
    const innerW = W - PAD.left - PAD.right;
    const t = (mx - PAD.left) / innerW;
    const idx = Math.round(t * (n <= 1 ? 0 : n - 1));
    const clamped = Math.max(0, Math.min(n - 1, idx));
    setHover({ idx: clamped, x: scaleX(clamped), y: PAD.top + (H - PAD.top - PAD.bottom) / 2 });
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-auto max-h-[min(70vh,520px)] w-full min-w-[320px] touch-none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <rect width={W} height={H} fill="transparent" />
        {/* grid */}
        {yTicks.map((yt, i) => {
          const y = scaleY(yt);
          return (
            <line
              key={i}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="#3f3f46"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          );
        })}
        {/* axes */}
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={H - PAD.bottom}
          stroke="#71717a"
          strokeWidth={1}
        />
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          stroke="#71717a"
          strokeWidth={1}
        />
        {yTicks.map((yt, i) => (
          <text
            key={`yt-${i}`}
            x={PAD.left - 8}
            y={scaleY(yt)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="#a1a1aa"
            fontSize={11}
          >
            {Math.round(yt)}
          </text>
        ))}
        {xTicks.map((xt) => (
          <text
            key={xt.idx}
            x={scaleX(xt.idx)}
            y={H - PAD.bottom + 22}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize={11}
          >
            {xt.label}
          </text>
        ))}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fill="#71717a"
          fontSize={11}
        >
          日期（台北）
        </text>
        <text
          x={14}
          y={H / 2}
          textAnchor="middle"
          fill="#71717a"
          fontSize={11}
          transform={`rotate(-90 14 ${H / 2})`}
        >
          積分
        </text>

        {paths.map((p) => (
          <path
            key={p.userId}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {hover && (
          <line
            x1={hover.x}
            x2={hover.x}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="#a1a1aa"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none mx-auto mt-2 max-w-[920px] rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-200 shadow-lg"
          style={{ minHeight: "3rem" }}
        >
          <p className="font-medium text-white">{dates[hover.idx]}</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {series.map((s) => {
              const v = s.points[hover.idx];
              return (
                <li key={s.userId} className="flex items-center gap-1.5 tabular-nums">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="text-zinc-400">{s.nickname}</span>
                  <span>{v == null ? "—" : `${Math.round(v)} 分`}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ul className="mx-auto mt-4 flex max-w-[920px] flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
        {series.map((s) => (
          <li key={s.userId} className="flex items-center gap-2">
            <span className="h-2 w-6 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-zinc-300">{s.nickname}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
