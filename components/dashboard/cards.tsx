"use client";

import { useState, type ReactNode } from "react";
import { DisclosureIcon, TrafficSourceIcon, WarningXsIcon } from "@/components/icons-dashboard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { Delta, TrafficSourceId } from "@/data/dashboard/types";
import { heatOpacity, type FunnelRowView } from "@/lib/dashboard/queries";
import { ChartLegend, LineChart, type ChartSeries, type LegendItem } from "./line-chart";
import { BackBar, CardActions, CardControls, CardShell, CardTitle, DeltaChip, FilterChip, SegmentedControl, type CheckGroup } from "./ui";

// 대시보드 카드 (재사용 컴포넌트). 표시할 값은 모두 props — 컴포넌트 안에서 데이터를 정의하지 않는다.
// 같은 유형(선 차트 / 막대 목록 / 흐름 / 퍼널 / 코호트 표)은 같은 컴포넌트를 쓴다.

type Toggle<T extends string> = { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void };

/** 카드 안 Filter by 상태 (Overview·Experience 카드: 그 카드에만 추가로 적용) */
export type CardFilter = { checked: string[]; onChange: (checked: string[]) => void };

/** Breakdown 한 줄: category 색(공통 매핑)과 값 */
export type BreakdownBar = { key: string; label: string; color: string; value: number | null };

/** Breakdown 막대 묶음: 기본 막대(36) 절반 높이(18) 막대를 category마다 한 줄씩, gap 4 */
function BreakdownBars({ bars }: { bars: BreakdownBar[] }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      {bars.map((b) => (
        <span key={b.key} className="relative h-[18px] rounded-sm bg-chart-bar-track">
          {b.value !== null && (
            <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${b.value}%`, background: `var(${b.color})` }} />
          )}
        </span>
      ))}
    </span>
  );
}

/** 카드 머리: 제목+ⓘ … [토글] [기간·필터] Explore ⋮. 카드 필터를 고르면 머리 아래에 필터 칩 */
function CardHeader<T extends string>({
  title,
  info,
  toggle,
  controls,
  cardFilter,
  onExplore,
}: {
  title: string;
  info: string;
  toggle?: Toggle<T>;
  controls?: CheckGroup[];
  /** 카드 필터 상태 (없으면 카드 안에서만 기억) */
  cardFilter?: CardFilter;
  onExplore: () => void;
}) {
  const [ownChecked, setOwnChecked] = useState<string[]>([]);
  const checked = cardFilter?.checked ?? ownChecked;
  const setChecked = (next: string[] | ((c: string[]) => string[])) => {
    const value = typeof next === "function" ? next(checked) : next;
    if (cardFilter) cardFilter.onChange(value);
    else setOwnChecked(value);
  };
  const labelOf = (v: string) => controls?.flatMap((g) => g.options).find((o) => o.value === v)?.label ?? v;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex min-h-9 w-full flex-wrap items-center gap-x-4 gap-y-3">
        <CardTitle title={title} info={info} />
        <div className="min-w-px flex-1" />
        <div className="flex flex-wrap items-center gap-6">
          {controls && <CardControls groups={controls} checked={checked} onChange={(v) => setChecked(v)} />}
          <div className="flex items-center gap-4">
            {toggle && <SegmentedControl {...toggle} />}
            <CardActions onExplore={onExplore} />
          </div>
        </div>
      </div>
      {checked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {checked.map((v) => (
            <FilterChip key={v} label={labelOf(v)} onRemove={() => setChecked((c) => c.filter((x) => x !== v))} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Figma `Card / Value`: 캡션 14 secondary + 값 32 Bold 1.5, gap 4 */
function CardValue({ caption, value }: { caption: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label-default text-text-secondary">{caption}</span>
      <span className="text-[32px] leading-[1.5] font-bold text-text-primary">{value}</span>
    </div>
  );
}

// ── 선 차트 카드 (DAU, Playtime, Sessions, Session time, D1/D7 retention) ─────────
export type LineCardProps<T extends string> = {
  title: string;
  info: string;
  caption: string;
  /** null = 머리 숫자 없음 (Breakdown일 때 — 비교할 수 없으므로 숫자와 캡션을 뺀다) */
  value: string | null;
  labels: string[];
  series: ChartSeries[];
  axisMax: number;
  formatTick: (v: number) => string;
  legend: LegendItem[];
  curve?: "linear" | "monotone";
  toggle?: Toggle<T>;
  onExplore: () => void;
};

/** Figma 선 차트 카드: p32 gap28 / Top gap16 / Chart block gap24 */
export function LineMetricCard<T extends string>(p: LineCardProps<T>) {
  return (
    <CardShell className="gap-7 p-8">
      <div className="flex flex-col gap-4">
        <CardHeader title={p.title} info={p.info} toggle={p.toggle} onExplore={p.onExplore} />
        {p.value !== null && <CardValue caption={p.caption} value={p.value} />}
      </div>
      <div className="flex flex-col gap-6">
        <LineChart labels={p.labels} series={p.series} axisMax={p.axisMax} formatTick={p.formatTick} curve={p.curve} />
        <ChartLegend items={p.legend} />
      </div>
    </CardShell>
  );
}

// ── New and returning users (+ Traffic sources) ────────────────────────────────
export function NewReturningCard<T extends string>({
  traffic,
  trafficTitle,
  trafficInfo,
  ...p
}: LineCardProps<T> & {
  traffic: { id: TrafficSourceId; label: string; share: number | null; value: string }[];
  trafficTitle: string;
  trafficInfo: string;
}) {
  return (
    <CardShell className="gap-7 p-8">
      <div className="flex flex-col gap-4">
        <CardHeader title={p.title} info={p.info} toggle={p.toggle} onExplore={p.onExplore} />
        {p.value !== null && <CardValue caption={p.caption} value={p.value} />}
      </div>
      <div className="flex gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <LineChart labels={p.labels} series={p.series} axisMax={p.axisMax} formatTick={p.formatTick} curve={p.curve} />
          <ChartLegend items={p.legend} />
        </div>
        {/* Figma Side: pt8, 1px 구분선(bg/subtle) + gap48 + Traffic sources w352 */}
        <div className="flex shrink-0 gap-12 pt-2">
          <span aria-hidden className="w-px self-stretch bg-bg-subtle" />
          <div className="flex w-[352px] flex-col gap-6">
            <div className="flex items-center gap-2">
              <h3 className="text-[20px] leading-[1.5] font-bold text-text-primary">{trafficTitle}</h3>
              <InfoTooltip text={trafficInfo} tone="primary" size={14} strokeWidth={1.2} />
            </div>
            <div className="flex flex-col gap-4">
              {traffic.map((s) => (
                // Figma `Progress row`: 라벨 16/1.6 + 값 14 오른쪽, 아래 4px 막대 (chart/bar/accent). 아이콘은 디자이너 요청으로 추가
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex h-[26px] items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <TrafficSourceIcon source={s.id} className="shrink-0 text-icon-primary" />
                      <span className="truncate text-fs-16 leading-[1.6] text-text-primary">{s.label}</span>
                    </span>
                    <span className="text-label-default text-text-primary">{s.value}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-md bg-chart-bar-track">
                    <div className="h-full rounded-md bg-chart-bar-accent" style={{ width: `${s.share ?? 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ── 선택 가능한 행 레이어 ────────────────────────────────────────────────────────
/** 행 뒤 반투명 레이어 (좌우 12, 상하 4 bleed, radius 8) — 선택·hover (CLAUDE.md 데이터 행 규칙) */
function RowLayer({ show }: { show: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -inset-x-3 -inset-y-1 rounded-md bg-data-select-row transition-opacity ${
        show ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}
    />
  );
}

// ── Exit rate (장소별 막대) ─────────────────────────────────────────────────────
export function BarListCard({
  title,
  info,
  rows,
  selectedId,
  onSelect,
  controls,
  cardFilter,
  legend,
  onExplore,
}: {
  title: string;
  info: string;
  rows: { id: string; label: string; value: number | null; valueLabel: string; breakdown?: BreakdownBar[] | null }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  controls: CheckGroup[];
  cardFilter?: CardFilter;
  /** Breakdown 범례 (없으면 표시 안 함) */
  legend?: LegendItem[] | null;
  onExplore: () => void;
}) {
  const max = Math.max(...rows.map((r) => r.value ?? 0));
  return (
    <CardShell className="gap-10 p-8">
      <CardHeader title={title} info={info} controls={controls} cardFilter={cardFilter} onExplore={onExplore} />
      {legend && legend.length > 0 && <ChartLegend items={legend} align="start" />}
      <div className="flex flex-col gap-6">
        {rows.map((r) => {
          const selected = r.id === selectedId;
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(r.id)}
              className={`group relative flex w-full items-center gap-4 text-left cursor-pointer ${r.breakdown ? "min-h-9" : "h-9"}`}
            >
              <RowLayer show={selected} />
              <span className={`relative w-16 shrink-0 text-fs-16 leading-[1.5] ${selected ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"}`}>
                {r.label}
              </span>
              {/* 채움 길이 = 데이터 비율 (Figma padding 복사 안 함). Breakdown이면 category별 절반 높이 막대 */}
              {r.breakdown ? (
                <BreakdownBars bars={r.breakdown} />
              ) : (
                <span className="relative h-9 min-w-0 flex-1 rounded-md bg-chart-bar-track">
                  {r.value !== null && (
                    <span
                      className={`absolute inset-y-0 left-0 rounded-md ${r.value === max ? "bg-chart-series-primary" : "bg-chart-bar-default"}`}
                      style={{ width: `${r.value}%` }}
                    />
                  )}
                </span>
              )}
              <span className="relative w-14 shrink-0 text-fs-16 leading-[1.6] text-text-primary">{r.valueLabel}</span>
            </button>
          );
        })}
      </div>
    </CardShell>
  );
}

// ── Session flow (아코디언) ─────────────────────────────────────────────────────
export function FlowCard({
  title,
  info,
  backLabel,
  onBack,
  sourceLabel,
  sourceValue,
  headers,
  rows,
  visibleCount,
  otherLabel,
  legend,
  onExplore,
}: {
  title: string;
  info: string;
  backLabel: string;
  onBack: () => void;
  sourceLabel: string;
  sourceValue: string;
  headers: { count: string; share: string };
  rows: { id: string; label: string; share: number; count: string; percent: string; tone: "end" | "top" | "default"; breakdown?: BreakdownBar[] | null }[];
  legend?: LegendItem[] | null;
  /** 처음 보이는 행 수. 나머지는 Other n 아래에 접힌다 */
  visibleCount: number;
  otherLabel: string;
  onExplore: () => void;
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const head = rows.slice(0, visibleCount);
  const rest = rows.slice(visibleCount);

  const row = (r: (typeof rows)[number]) => {
    const bold = r.tone === "end";
    const fill = r.tone === "end" ? "bg-chart-series-primary" : r.tone === "top" ? "bg-chart-bar-emphasis" : "bg-chart-bar-default";
    return (
      <div key={r.id} className={`relative flex items-center gap-4 ${r.breakdown ? "min-h-9" : "h-9"}`}>
        {/* 가지 (Figma Branch: 줄기에서 24px, 행 가운데) */}
        <span aria-hidden className="absolute top-1/2 -left-9 h-[1.5px] w-6 -translate-y-1/2 bg-chart-flow-line" />
        <span className={`w-40 shrink-0 truncate text-fs-16 leading-[1.5] text-text-primary ${bold ? "font-bold" : ""}`}>{r.label}</span>
        {r.breakdown ? (
          <BreakdownBars bars={r.breakdown} />
        ) : (
          <span className="relative h-9 min-w-0 flex-1 rounded-md bg-chart-bar-track">
            <span className={`absolute inset-y-0 left-0 rounded-md ${fill}`} style={{ width: `${r.share}%` }} />
          </span>
        )}
        <span className={`w-14 shrink-0 text-right text-fs-16 leading-[1.5] text-text-primary ${bold ? "font-bold" : ""}`}>{r.count}</span>
        <span className={`w-16 shrink-0 text-right text-fs-16 leading-[1.5] ${bold ? "font-bold text-text-primary" : "text-text-secondary"}`}>{r.percent}</span>
      </div>
    );
  };

  return (
    <CardShell className="overflow-hidden">
      <BackBar label={backLabel} onBack={onBack} />
      <div className="flex flex-col gap-10 p-8" style={{ animation: "gc-fade-in 220ms ease-out both" }}>
        <CardHeader title={title} info={info} onExplore={onExplore} />
        {legend && legend.length > 0 && <ChartLegend items={legend} align="start" />}
        <div className="relative flex flex-col">
          <div className="flex flex-col gap-1">
            <span className="text-fs-14 leading-[1.5] text-text-secondary">{sourceLabel}</span>
            <span className="text-[32px] leading-[48px] font-bold text-text-primary">{sourceValue}</span>
          </div>
          {/* 열 제목: 첫 행 12px 위 (Figma y67) */}
          <div className="absolute top-[67px] right-0 flex gap-4 text-fs-14 leading-[1.5] text-text-secondary">
            <span className="w-14 text-right">{headers.count}</span>
            <span className="w-16 text-right">{headers.share}</span>
          </div>
          {/* 줄기: 숫자 아래 8px에서 마지막 행 가운데까지 (x12) */}
          <div className="relative mt-[27px] flex flex-col gap-3 pl-12">
            <span aria-hidden className="absolute -top-[19px] bottom-[18px] left-3 w-[1.5px] bg-chart-flow-line" />
            {head.map(row)}
            {rest.length > 0 && (
              <button
                type="button"
                aria-expanded={otherOpen}
                onClick={() => setOtherOpen((o) => !o)}
                className="flex h-9 w-fit items-center gap-2 text-fs-16 leading-[1.5] cursor-pointer"
              >
                <DisclosureIcon open={otherOpen} className="shrink-0 text-icon-primary" />
                <span className="text-text-primary">{otherLabel}</span>
                <span className="text-text-secondary">{rest.length}</span>
              </button>
            )}
            {otherOpen && rest.map(row)}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

// ── 퍼널 카드 (Stage progression / New user progression) ────────────────────────
/** delta = null이면 비교 기간 데이터 없음 → noComparison 문구 */
export type KpiItemView = {
  label: string;
  value: string;
  info?: string;
  delta: Delta | null;
  deltaLabel?: string;
  comparison?: string;
  noComparison: string;
};

export function FunnelCard({
  title,
  info,
  tabs,
  kpis,
  sectionTitle,
  labels,
  steps,
  controls,
  cardFilter,
  legend,
  onExplore,
}: {
  title: string;
  info: string;
  cardFilter?: CardFilter;
  /** Breakdown 범례 — 있으면 Reached/Dropped 대신 표시 */
  legend?: LegendItem[] | null;
  tabs?: { items: { id: string; label: string }[]; selected: string; onSelect: (id: string) => void };
  kpis: KpiItemView[];
  sectionTitle: string;
  labels: { step: string; users: string; dropOff: string; reached: string; dropped: string };
  steps: (FunnelRowView & { label: string; usersLabel: string; reachLabel: string; dropLabel: string | null; breakdown?: BreakdownBar[] | null })[];
  controls: CheckGroup[];
  onExplore: () => void;
}) {
  return (
    <CardShell className={`p-8 ${tabs ? "gap-11" : "gap-[52px]"}`}>
      <div className={`flex flex-col ${tabs ? "gap-3" : "gap-9"}`}>
        <CardHeader title={title} info={info} controls={controls} cardFilter={cardFilter} onExplore={onExplore} />
        {tabs && (
          <div role="tablist" className="flex shadow-[inset_0_-1px_0_var(--gc-border-default)]">
            {tabs.items.map((tab) => {
              const selected = tab.id === tabs.selected;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => tabs.onSelect(tab.id)}
                  className={`flex h-12 w-24 items-center justify-center text-fs-16 leading-[1.5] cursor-pointer ${
                    selected ? "text-text-primary shadow-[inset_0_-2px_0_var(--gc-icon-primary)]" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
        {!tabs && <KpiSummary kpis={kpis} />}
      </div>
      <div className="flex flex-col gap-[52px]">
        {tabs && <KpiSummary kpis={kpis} />}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-6">
            <h3 className="text-[18px] leading-[1.5] font-bold text-text-primary">{sectionTitle}</h3>
            {legend && legend.length > 0 ? (
              <ChartLegend items={legend} align="start" />
            ) : (
              <div className="flex items-center gap-6">
                <LegendSwatch label={labels.reached} />
                <LegendSwatch label={labels.dropped} dropped />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex text-label-default text-text-secondary">
                <span className="w-[216px] shrink-0">{labels.step}</span>
                <span className="flex-1" />
                <span className="w-28 shrink-0 text-right">{labels.users}</span>
                <span className="w-38 shrink-0 text-right">{labels.dropOff}</span>
              </div>
              <div className="h-px w-full bg-bg-subtle" />
            </div>
            <div className="flex flex-col gap-4">
              {steps.map((s, i) => (
                <div key={i} className={`flex items-center ${s.breakdown ? "min-h-9" : "h-9"}`}>
                  <span className={`w-[216px] shrink-0 text-fs-16 leading-[1.5] text-text-primary ${s.isMaxDrop ? "font-bold" : ""}`}>{s.label}</span>
                  {s.breakdown ? <BreakdownBars bars={s.breakdown} /> : <FunnelTrack row={s} />}
                  <span className={`w-28 shrink-0 text-right text-fs-16 leading-[1.5] ${s.isMaxDrop ? "font-bold text-text-primary" : "text-text-secondary"}`}>
                    {s.usersLabel}
                  </span>
                  <span className="flex w-38 shrink-0 items-center justify-end gap-1 text-fs-16 leading-[1.5]">
                    {s.dropLabel === null ? (
                      <span className="text-text-secondary">–</span>
                    ) : s.isMaxDrop ? (
                      <>
                        <WarningXsIcon className="shrink-0 text-text-critical" />
                        <span className="font-bold text-text-critical">{s.dropLabel}</span>
                      </>
                    ) : (
                      <span className="text-text-primary">{s.dropLabel}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/** 빗금: Figma Hatch (stripe 5px, opacity 0.4 / 가장 큰 이탈은 series/exit 0.3) */
/** 빗금. small = 범례 칸(12px)용 — 막대와 같은 간격이면 줄이 한두 개뿐이라 안 보이므로 촘촘하게 */
function Hatch({ strong = false, small = false }: { strong?: boolean; small?: boolean }) {
  const color = strong ? "var(--gc-chart-series-exit)" : "var(--gc-chart-funnel-dropped-stripe)";
  const [line, period] = small ? [1.5, 3.5] : [3.5, 10];
  return (
    <span
      aria-hidden
      className="absolute inset-0"
      style={{
        opacity: strong ? 0.3 : small ? 0.6 : 0.4,
        backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0 ${line}px, transparent ${line}px ${period}px)`,
      }}
    />
  );
}

function FunnelTrack({ row }: { row: FunnelRowView & { reachLabel: string } }) {
  const dropped = row.previousReach - row.reachRate;
  return (
    <span className="relative flex h-9 min-w-0 flex-1 overflow-hidden rounded-md bg-chart-bar-track">
      <span
        className={`flex h-full shrink-0 items-center justify-end bg-chart-bar-default pr-3 ${dropped > 0 ? "rounded-l-md" : "rounded-md"}`}
        style={{ width: `${row.reachRate}%` }}
      >
        <span className="text-fs-14 leading-[1.5] whitespace-nowrap text-text-primary">{row.reachLabel}</span>
      </span>
      {dropped > 0 && (
        <span className="relative h-full shrink-0 overflow-hidden rounded-r-md bg-chart-funnel-dropped" style={{ width: `${dropped}%` }}>
          <Hatch strong={row.isMaxDrop} />
        </span>
      )}
    </span>
  );
}

function LegendSwatch({ label, dropped = false }: { label: string; dropped?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`relative size-3 overflow-hidden rounded-sm ${dropped ? "bg-chart-funnel-dropped" : "bg-chart-bar-default"}`}>
        {dropped && <Hatch small />}
      </span>
      <span className="text-fs-14 leading-[1.5] text-text-secondary">{label}</span>
    </span>
  );
}

/** Figma `KPI summary`: 항목 gap20, 사이 1×56 구분선. 항목 = 라벨 14 · 값 40 Bold · 증감 행 */
function KpiSummary({ kpis }: { kpis: KpiItemView[] }) {
  return (
    <div className="flex items-center gap-5">
      {kpis.map((k, i) => (
        <div key={k.label} className="flex items-center gap-5">
          {i > 0 && <span aria-hidden className="h-14 w-px bg-bg-subtle" />}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="flex items-center gap-1 text-label-default text-text-secondary">
                {k.label}
                {k.info && <InfoTooltip text={k.info} size={14} strokeWidth={1.2} />}
              </span>
              <span className="text-[40px] leading-[1.5] font-bold text-text-primary">{k.value}</span>
            </div>
            {/* 비교 기간 데이터가 없으면 칩 대신 "— No comparison data" */}
            <div className="flex h-6 items-center gap-2">
              {k.delta ? (
                <>
                  <DeltaChip delta={k.delta} label={k.deltaLabel ?? ""} />
                  <span className="text-caption-default text-text-secondary">{k.comparison}</span>
                </>
              ) : (
                <span className="text-caption-default text-text-secondary">{k.noComparison}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 코호트 히트맵 카드 ─────────────────────────────────────────────────────────
export function CohortCard({
  title,
  info,
  back,
  rowHeader,
  usersHeader,
  dayLabels,
  rows,
  tone,
  selectedId,
  onSelect,
  onExplore,
  format,
}: {
  title: string;
  info: string;
  back?: { label: string; onBack: () => void };
  rowHeader: string;
  usersHeader: string;
  dayLabels: string[];
  rows: { id: string; label: string; users: string; values: (number | null)[] }[];
  /** date cohort = accent, progression cohort = emphasis */
  tone: "accent" | "emphasis";
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onExplore: () => void;
  format: (v: number) => string;
}) {
  const all = rows.flatMap((r) => r.values.filter((v): v is number => v !== null));
  const min = Math.min(...all);
  const max = Math.max(...all);
  const cellGrid = { gridTemplateColumns: `repeat(${dayLabels.length}, minmax(0, 1fr))` };

  return (
    <CardShell className="overflow-hidden">
      {back && <BackBar label={back.label} onBack={back.onBack} />}
      <div className="flex flex-col gap-10 p-8" style={back ? { animation: "gc-fade-in 220ms ease-out both" } : undefined}>
        <CardHeader title={title} info={info} onExplore={onExplore} />
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-10 text-label-default text-text-secondary">
            <div className="flex w-62 shrink-0">
              <span className="w-32">{rowHeader}</span>
              <span className="w-30 text-right">{usersHeader}</span>
            </div>
            <div className="grid min-w-0 flex-1 gap-2 text-center" style={cellGrid}>
              {dayLabels.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {rows.map((r) => {
              const selected = r.id === selectedId;
              const Row = onSelect ? "button" : "div";
              return (
                <Row
                  key={r.id}
                  {...(onSelect ? { type: "button" as const, onClick: () => onSelect(r.id), "aria-pressed": selected } : {})}
                  className={`group relative flex h-10 w-full items-center gap-10 text-left ${onSelect ? "cursor-pointer" : ""}`}
                >
                  {onSelect && <RowLayer show={selected} />}
                  <div className="relative flex w-62 shrink-0 items-center text-fs-16 leading-[1.5]">
                    <span className={`w-32 ${selected ? "text-text-primary" : "text-text-secondary"} ${onSelect ? "group-hover:text-text-primary" : ""}`}>
                      {r.label}
                    </span>
                    <span className={`w-30 text-right ${selected ? "text-text-primary" : "text-text-secondary"}`}>{r.users}</span>
                  </div>
                  <div className="relative grid min-w-0 flex-1 gap-2" style={cellGrid}>
                    {r.values.map((v, i) => (
                      <HeatCell key={i} value={v} opacity={v === null ? 0 : heatOpacity(v, min, max, tone)} tone={tone} format={format} />
                    ))}
                  </div>
                </Row>
              );
            })}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

/** Figma `Heatmap cell`: h40 radius 8. 배경 레이어 opacity = 값 비례, 글자는 불투명. 빈 칸 = chart/label "–" */
function HeatCell({
  value,
  opacity,
  tone,
  format,
}: {
  value: number | null;
  opacity: number;
  tone: "accent" | "emphasis";
  format: (v: number) => string;
}) {
  return (
    <span className="relative flex h-10 items-center justify-center rounded-md text-fs-16 leading-[1.5]">
      {value !== null && (
        <span
          aria-hidden
          className={`absolute inset-0 rounded-md ${tone === "accent" ? "bg-chart-heatmap-accent" : "bg-chart-heatmap-emphasis"}`}
          style={{ opacity }}
        />
      )}
      <span className={`relative ${value === null ? "text-chart-label" : "text-text-primary"}`}>{value === null ? "–" : format(value)}</span>
    </span>
  );
}

/** 카드 묶음 사이 아코디언 (위 카드에서 행을 고르면 아래로 펼쳐짐) */
export function Accordion({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null;
  // 위 카드에서 열린 하위 카드: 카드 사이 간격(48)의 절반(24)으로 붙인다
  return (
    <div className="-mt-6" style={{ animation: "gc-rise-in 260ms cubic-bezier(0.2,0.8,0.2,1) both" }}>
      {children}
    </div>
  );
}
