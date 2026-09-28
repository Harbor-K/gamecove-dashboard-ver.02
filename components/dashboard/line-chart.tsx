"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";

// Figma `Chart / Line` (h283): Y축 w48 · 눈금 12/1.5 chart/label, 그리드 chart/grid(맨 아래 기준선 text/secondary),
// 플롯 위 9px, X축 라벨은 기준선 아래 16px. 선 2px, 면 = chart/area/{primary|muted}-0…4 그라디언트.
// 데이터 hover 툴팁은 dummy dataset 연결 후 붙인다 — 그때 <Tooltip />만 더하면 된다.

export type ChartSeries = {
  key: string;
  /** null = 계산할 수 없는 날 (선이 끊긴다, 0으로 그리지 않음) */
  values: (number | null)[];
  /** 선 색 토큰 (예: --gc-chart-series-primary) */
  stroke: string;
  /** 면 그라디언트 토큰 묶음 (primary | muted). 없으면 면 없음 */
  area?: "primary" | "muted";
};

const AREA_STOPS = [0, 33, 62, 88, 100];
const TICK_COUNT = 5;
const PLOT_TOP = 9;
const Y_AXIS_W = 48;
/** 축 눈금 12px (Figma) */
const TICK_FONT = "12px";

export function LineChart({
  labels,
  series,
  axisMax,
  formatTick,
  curve = "linear",
  height = 283,
}: {
  labels: string[];
  series: ChartSeries[];
  axisMax: number;
  formatTick: (value: number) => string;
  curve?: "linear" | "monotone";
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  // __axis: 값이 모두 비어도(예: D7) 축·그리드가 그려지도록 보이지 않는 0 기준값
  const data = labels.map((label, i) => ({ label, __axis: 0, ...Object.fromEntries(series.map((s) => [s.key, s.values[i]])) }));
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (axisMax / TICK_COUNT) * i);
  const last = labels.length - 1;
  const [boxRef, width] = useWidth();
  // 폭이 바뀌는 동안(내비·드로어 애니메이션)에는 다시 그리지 않고 지금 그림을 칸에 맞춰 늘이고 줄인다 → 선이 끊기거나 사라지지 않음.
  // 멈추면 useWidth가 새 폭으로 한 번 다시 그린다.
  // recharts가 SVG를 나중에(다시) 만들기도 하므로 생길 때마다 붙인다
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const stretch = () => box.querySelector("svg.recharts-surface")?.setAttribute("preserveAspectRatio", "none");
    stretch();
    const mo = new MutationObserver(stretch);
    mo.observe(box, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [boxRef]);

  return (
    // 폭이 바뀌는 동안 이전 크기 차트가 카드 밖으로 넘치지 않게
    <div ref={boxRef} style={{ height }} className="gc-line-chart w-full overflow-hidden select-none">
      {width > 0 && (
        <ComposedChart width={width} height={height} data={data} margin={{ top: PLOT_TOP, right: 0, bottom: 0, left: 0 }}>
          <defs>
            {(["primary", "muted"] as const).map((tone) => (
              <linearGradient key={tone} id={`${id}-${tone}`} x1="0" y1="0" x2="0" y2="1">
                {AREA_STOPS.map((offset, i) => (
                  <stop key={offset} offset={`${offset}%`} stopColor={`var(--gc-chart-area-${tone}-${i})`} />
                ))}
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--gc-chart-grid)" strokeWidth={1} />
          <YAxis
            width={Y_AXIS_W}
            domain={[0, axisMax]}
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={({ y, payload }: { y?: number | string; payload?: { value: number } }) => (
              <text x={0} y={Number(y)} dy={4} textAnchor="start" fill="var(--gc-chart-label)" style={{ fontSize: TICK_FONT }}>
                {formatTick(payload?.value ?? 0)}
              </text>
            )}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            height={34}
            tick={({ x, y, payload, index }: { x?: number | string; y?: number | string; payload?: { value: string }; index?: number }) => (
              <text
                x={Number(x)}
                y={Number(y) + 16}
                dy={9}
                textAnchor={index === 0 ? "start" : index === last ? "end" : "middle"}
                fill="var(--gc-chart-label)"
                style={{ fontSize: TICK_FONT }}
              >
                {payload?.value}
              </text>
            )}
          />
          {/* 기준선 (Figma Gridline 6: text/secondary) */}
          <ReferenceLine y={0} stroke="var(--gc-text-secondary)" strokeWidth={1} />
          {series
            .filter((s) => s.area)
            .map((s) => (
              <Area
                key={`${s.key}-area`}
                type={curve}
                dataKey={s.key}
                stroke="none"
                fill={`url(#${id}-${s.area})`}
                fillOpacity={1}
                isAnimationActive={false}
              />
            ))}
          <Line dataKey="__axis" stroke="none" dot={false} activeDot={false} isAnimationActive={false} legendType="none" />
          {series.map((s) => (
            <Line
              key={s.key}
              type={curve}
              dataKey={s.key}
              stroke={`var(${s.stroke})`}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      )}
    </div>
  );
}

/**
 * 차트 폭(CSS px). recharts의 ResponsiveContainer는 화면 px로 재서 화면 배율(--gc-zoom)만큼 작게 그려지므로
 * offsetWidth(CSS px)로 직접 잰다.
 * 내비·드로어가 열리고 닫히는 동안(폭 애니메이션) 매 프레임 다시 그리면 버벅이므로, 폭이 멈춘 뒤 한 번만 다시 그린다.
 */
const RESIZE_SETTLE_MS = 120;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.offsetWidth);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => setWidth(el.offsetWidth), RESIZE_SETTLE_MS);
    });
    ro.observe(el);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);
  return [ref, width] as const;
}

/** Figma `Chart / Legend item` (Swatch=Line): 20×2 선 + 14 secondary, gap 8. 항목 사이 24, 가운데 정렬 */
export type LegendItem = { label: string; color: string; swatch?: "line" | "bar" };

export function ChartLegend({ items, align = "center" }: { items: LegendItem[]; align?: "center" | "start" }) {
  return (
    <div className={`flex flex-wrap items-center gap-6 ${align === "center" ? "justify-center" : "justify-start"}`}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className={item.swatch === "bar" ? "size-3 rounded-sm" : "h-0.5 w-5 rounded-sm"}
            style={{ background: `var(${item.color})` }}
          />
          <span className="text-label-default text-text-secondary">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
