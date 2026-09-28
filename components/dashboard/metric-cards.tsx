"use client";

import { useParams, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { mappingNodes } from "@/data/logging";
import { dashboardDefaults, filterOptions } from "@/data/dashboard/dataset";
import type { AreaId, BreakdownValue, DashboardFilters, FunnelStep, MetricId } from "@/data/dashboard/types";
import {
  AREAS,
  RETENTION_MAX_DAY,
  STAGES,
  defaultFilters,
  funnelRows,
  getAverageSessionTime,
  getDailyActiveUsers,
  getDateCohorts,
  getExitRate,
  getNewReturning,
  getNewUserProgression,
  getPlaytime,
  getProgressionCohorts,
  getRetention,
  getSessionFlow,
  getSessions,
  getStageProgression,
  getTrafficSources,
  periodDates,
  type BreakdownDimension,
  type FunnelResult,
  type LineResult,
} from "@/lib/dashboard/queries";
import { breakdownColor } from "@/lib/dashboard/breakdown-colors";
import { formatDay, formatDuration, formatNumber, formatPercent, formatTick, formatUnit } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages";
import { usePersistentState, useSharedState } from "@/lib/setup-store";
import {
  Accordion,
  BarListCard,
  CohortCard,
  FlowCard,
  FunnelCard,
  LineMetricCard,
  NewReturningCard,
  type BreakdownBar,
  type CardFilter,
  type KpiItemView,
} from "./cards";
import type { LegendItem } from "./line-chart";
import { useDashboardFilters } from "./page-chrome";
import type { CheckGroup } from "./ui";

// 지표 카드 = 조회 함수(lib/dashboard/queries) + 재사용 카드. 페이지와 Explore가 같은 카드를 쓴다.
// 여기서도 숫자를 쓰지 않는다 — dataset에서 계산한 값에 형식만 입힌다.

const areaLabel = (id: AreaId) => mappingNodes.find((n) => n.id === id)?.label ?? id;

// ── 필터 범위 ─────────────────────────────────────────────────────────────────
/**
 * 카드가 읽는 필터:
 * - "page": 페이지 필터 + Breakdown (Engagement · Retention)
 * - "explore": 페이지 필터만 (Explore에는 Breakdown 선택이 없다)
 * - "card": 페이지 필터 없음 (Overview · Experience) — 카드 안 Filter by만
 * 카드 안 Filter by는 어느 범위든 그 카드에만 추가로(AND) 적용된다.
 */
type FilterScope = "page" | "explore" | "card";
const FilterScopeContext = createContext<FilterScope>("card");

export function FilterScopeProvider({ scope, children }: { scope: FilterScope; children: ReactNode }) {
  return <FilterScopeContext.Provider value={scope}>{children}</FilterScopeContext.Provider>;
}

/** 조건을 만족하는 값이 없을 때 (페이지 필터와 카드 필터가 겹치지 않음) — 어떤 행과도 맞지 않는 값 */
const NO_MATCH = "__none__";
const NO_CARD_FILTER: string[] = [];

function intersect<T extends string>(page: T[], card: T[]): T[] {
  if (!page.length) return card;
  if (!card.length) return page;
  const both = page.filter((v) => card.includes(v));
  return both.length ? both : [NO_MATCH as T];
}

/** 카드가 쓸 필터 (+ 카드 필터 상태). cardKey가 있으면 그 카드의 Filter by를 기억한다 */
function useMetricFilters(cardKey?: string): { filters: DashboardFilters; cardFilter?: CardFilter } {
  const scope = useContext(FilterScopeContext);
  const [pageFilters] = useDashboardFilters();
  const [checked, setChecked] = useSharedState<string[]>(`dash:cardFilter:${cardKey ?? "-"}`, NO_CARD_FILTER);
  const base: DashboardFilters =
    scope === "page" ? pageFilters : scope === "explore" ? { ...pageFilters, breakdown: [] } : defaultFilters;
  if (!cardKey) return { filters: base };
  const pick = <K extends "device" | "visitType" | "country">(k: K) =>
    checked.filter((v) => (filterOptions[k] as readonly string[]).includes(v)) as DashboardFilters[K];
  return {
    filters: {
      ...base,
      device: intersect(base.device, pick("device")),
      visitType: intersect(base.visitType, pick("visitType")),
      country: intersect(base.country, pick("country")),
    },
    cardFilter: { checked, onChange: setChecked },
  };
}

/** Explore 버튼: 이 지표를 Explore 페이지에서 연다 (선택된 대상이 있으면 함께) */
export function useExplore() {
  const router = useRouter();
  const { href } = useI18n();
  const { projectId } = useParams<{ projectId: string }>();
  return (metric: MetricId, selection?: string) =>
    router.push(href(`/projects/${projectId}/explore?metric=${metric}${selection ? `&selection=${encodeURIComponent(selection)}` : ""}`));
}

/** 카드 안 Filter by / Breakdown by 체크 목록 (Figma `Dropdown / Breakdown by`) */
export function useCategoryGroups(): CheckGroup[] {
  const { t } = useI18n();
  const f = t.dashboard.filters;
  return (["device", "visitType", "country"] as const).map((id) => ({
    id,
    title: f.categories[id],
    options: filterOptions[id].map((v) => ({ value: v, label: f.options[v] })),
  }));
}

// ── Breakdown 표시 도우미 ─────────────────────────────────────────────────────
function useBreakdownView() {
  const { t } = useI18n();
  const label = (c: BreakdownValue) => t.dashboard.filters.options[c];
  const color = (dimension: BreakdownDimension, c: BreakdownValue) => breakdownColor(dimension, c as never);
  /** 범례: category 순서 = 선택지 순서 (쿼리 결과 순서 그대로) */
  const legend = (dimension: BreakdownDimension | null, categories: BreakdownValue[], swatch: LegendItem["swatch"]): LegendItem[] | null =>
    dimension ? categories.map((c) => ({ label: label(c), color: color(dimension, c), swatch })) : null;
  const bars = (dimension: BreakdownDimension | null, items: { category: BreakdownValue; value: number | null }[] | null): BreakdownBar[] | null =>
    dimension && items ? items.map((b) => ({ key: b.category, label: label(b.category), color: color(dimension, b.category), value: b.value })) : null;
  return { label, color, legend, bars };
}

function useChartBasics() {
  const { t, locale } = useI18n();
  const labels = (dates: string[]) => dates.map((d) => formatDay(locale, d));
  return { t, locale, labels };
}

const tickFormatter = (t: Messages, locale: string, unit: LineResult["unit"]) => (v: number) =>
  unit === "percent" ? t.dashboard.units.percent(formatTick(locale, v)) : formatTick(locale, v);

/**
 * 선 차트 지표. Breakdown이 없으면 선 하나(기존 primary 색 + 면), 있으면 category별 선 + 범례, 머리 숫자는 뺀다.
 * emptyValue: 계산할 수 있는 값이 없을 때 머리 숫자 (예: D7 "0.00%")
 */
function SingleLineCard<T extends string>({
  metric,
  line,
  title,
  info,
  caption,
  legend,
  curve,
  toggle,
  emptyValue,
  nullAsZero = false,
}: {
  metric: MetricId;
  line: LineResult;
  title: string;
  info: string;
  caption: string;
  legend: string;
  curve?: "linear" | "monotone";
  toggle?: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void };
  emptyValue?: string;
  /** 계산할 수 없는 날(null)을 선에서 0으로 그린다 (Retention — 선이 끊기지 않게). 머리 숫자 계산에는 넣지 않는다 */
  nullAsZero?: boolean;
}) {
  const { t, locale, labels } = useChartBasics();
  const explore = useExplore();
  const bd = useBreakdownView();
  const dimension = line.breakdown;
  const plot = (values: (number | null)[]) => (nullAsZero ? values.map((v) => v ?? 0) : values);
  const value = dimension
    ? null
    : line.headline !== null
      ? formatUnit(t, locale, line.unit, line.headline, line.decimals)
      : (emptyValue ?? t.dashboard.noData);
  return (
    <LineMetricCard
      title={title}
      info={info}
      caption={caption}
      value={value}
      labels={labels(line.dates)}
      series={
        dimension
          ? line.series.map((s) => ({ key: s.key, values: plot(s.values), stroke: bd.color(dimension, s.category!) }))
          : [{ key: "value", values: plot(line.series[0].values), stroke: "--gc-chart-series-primary", area: "primary" }]
      }
      axisMax={line.axisMax}
      formatTick={tickFormatter(t, locale, line.unit)}
      legend={
        dimension
          ? bd.legend(dimension, line.series.map((s) => s.category!), "line")!
          : [{ label: legend, color: "--gc-chart-series-primary" }]
      }
      curve={curve}
      toggle={toggle}
      onExplore={() => explore(metric)}
    />
  );
}

export function DailyActiveUsersCard() {
  const { t } = useI18n();
  const { filters } = useMetricFilters();
  const c = t.dashboard.cards.dailyActiveUsers;
  return (
    <SingleLineCard
      metric="dailyActiveUsers"
      line={getDailyActiveUsers(filters)}
      title={c.title}
      info={t.dashboard.info.dailyActiveUsers}
      caption={c.caption}
      legend={c.legend}
    />
  );
}

export function PlaytimeCard() {
  const { t } = useI18n();
  const { filters } = useMetricFilters();
  const [mode, setMode] = usePersistentState<"average" | "total">("dash:playtime", "average");
  const c = t.dashboard.cards.playtime;
  return (
    <SingleLineCard
      metric="playtime"
      line={getPlaytime(filters, mode)}
      title={c.title}
      info={t.dashboard.info.playtime}
      caption={c[mode].caption}
      legend={c[mode].legend}
      toggle={{
        options: [
          { value: "average", label: t.dashboard.toggles.average },
          { value: "total", label: t.dashboard.toggles.total },
        ],
        value: mode,
        onChange: setMode,
      }}
    />
  );
}

export function SessionsCard() {
  const { t } = useI18n();
  const { filters } = useMetricFilters();
  const [mode, setMode] = usePersistentState<"perUser" | "total">("dash:sessions", "perUser");
  const c = t.dashboard.cards.sessions;
  return (
    <SingleLineCard
      metric="sessions"
      line={getSessions(filters, mode)}
      title={c.title}
      info={t.dashboard.info.sessions}
      caption={c[mode].caption}
      legend={c[mode].legend}
      toggle={{
        options: [
          { value: "perUser", label: t.dashboard.toggles.perUser },
          { value: "total", label: t.dashboard.toggles.total },
        ],
        value: mode,
        onChange: setMode,
      }}
    />
  );
}

export function SessionTimeCard() {
  const { t } = useI18n();
  const { filters } = useMetricFilters();
  const c = t.dashboard.cards.sessionTime;
  return (
    <SingleLineCard
      metric="sessionTime"
      line={getAverageSessionTime(filters)}
      title={c.title}
      info={t.dashboard.info.sessionTime}
      caption={c.caption}
      legend={c.legend}
    />
  );
}

/** D1: 관측 가능한 날짜별 값의 평균. D7: 아직 관측할 수 없어 선 없이 머리 숫자 0.00% (Roblox Analytics와 같게) */
export function RetentionLineCard({ day }: { day: "d1" | "d7" }) {
  const { t, locale } = useI18n();
  const { filters } = useMetricFilters();
  const c = t.dashboard.cards[day === "d1" ? "d1Retention" : "d7Retention"];
  return (
    <SingleLineCard
      metric={day === "d1" ? "d1Retention" : "d7Retention"}
      line={getRetention(filters, day === "d1" ? 1 : 7)}
      title={c.title}
      info={t.dashboard.info[day === "d1" ? "d1Retention" : "d7Retention"]}
      caption={c.caption}
      legend={c.legend}
      curve="monotone"
      emptyValue={formatPercent(t, locale, 0, 2)}
      nullAsZero
    />
  );
}

/**
 * 오른쪽 위 토글로 고른 쪽이 파랑 선, 다른 쪽은 회색 (범례도 함께 바뀜).
 * 이미 신규·재방문으로 나뉜 카드라 필터·Breakdown은 적용하지 않고, Traffic sources만 토글을 따라간다.
 */
export function NewReturningUsersCard() {
  const { t, locale, labels } = useChartBasics();
  const explore = useExplore();
  const [selected, setSelected] = usePersistentState<"new" | "returning">("dash:newReturning", "new");
  const nr = getNewReturning();
  const traffic = getTrafficSources(selected);
  const c = t.dashboard.cards.newAndReturning;
  const other = selected === "new" ? "returning" : "new";
  const legendLabel = { new: c.legendNew, returning: c.legendReturning };
  const headline = nr.headline[selected];
  return (
    <NewReturningCard
      title={c.title}
      info={t.dashboard.info.newAndReturning}
      caption={c.caption}
      value={headline === null ? t.dashboard.noData : formatUnit(t, locale, "users", headline, 0)}
      labels={labels(nr.dates)}
      // 선택 안 된 쪽을 먼저 그려서 선택된 선이 위에 오게
      series={[
        { key: other, values: nr.values[other], stroke: "--gc-chart-context-secondary", area: "muted" },
        { key: selected, values: nr.values[selected], stroke: "--gc-chart-series-primary", area: "primary" },
      ]}
      axisMax={nr.axisMax}
      formatTick={(v) => formatTick(locale, v)}
      legend={[
        { label: legendLabel.new, color: selected === "new" ? "--gc-chart-series-primary" : "--gc-chart-context-secondary" },
        { label: legendLabel.returning, color: selected === "returning" ? "--gc-chart-series-primary" : "--gc-chart-context-secondary" },
      ]}
      curve="monotone"
      toggle={{
        options: [
          { value: "new", label: t.dashboard.toggles.new },
          { value: "returning", label: t.dashboard.toggles.returning },
        ],
        value: selected,
        onChange: setSelected,
      }}
      onExplore={() => explore("newAndReturning")}
      traffic={traffic.map((s) => ({
        id: s.id,
        label: t.dashboard.trafficSources[s.id],
        share: s.share,
        value: s.share === null ? t.dashboard.retention.empty : formatPercent(t, locale, s.share, 0),
      }))}
      trafficTitle={t.dashboard.cards.trafficSources}
      trafficInfo={t.dashboard.info.trafficSources}
    />
  );
}

// ── Experience: Exit rate → Session flow ─────────────────────────────────────────
/** Exit rate와 그 아래 Session flow는 같은 카드 필터를 쓴다 */
const EXIT_RATE_FILTER = "exitRate";

export function ExitRateCard({ selected, onSelect }: { selected: AreaId | null; onSelect: (id: AreaId | null) => void }) {
  const { t, locale } = useI18n();
  const { filters, cardFilter } = useMetricFilters(EXIT_RATE_FILTER);
  const explore = useExplore();
  const groups = useCategoryGroups();
  const bd = useBreakdownView();
  const exit = getExitRate(filters);
  const categories = exit.rows[0]?.breakdown?.map((b) => b.category) ?? [];
  return (
    <BarListCard
      title={t.dashboard.cards.exitRate.title}
      info={t.dashboard.info.exitRate}
      rows={exit.rows.map((r) => ({
        id: r.area,
        label: areaLabel(r.area),
        value: r.rate,
        valueLabel: r.rate === null ? t.dashboard.retention.empty : formatPercent(t, locale, r.rate),
        breakdown: bd.bars(exit.breakdown, r.breakdown?.map((b) => ({ category: b.category, value: b.rate })) ?? null),
      }))}
      legend={bd.legend(exit.breakdown, categories, "bar")}
      selectedId={selected}
      // 같은 행을 다시 누르면 닫힌다
      onSelect={(id) => onSelect(selected === id ? null : (id as AreaId))}
      controls={groups}
      cardFilter={cardFilter}
      onExplore={() => explore("exitRate", selected ?? undefined)}
    />
  );
}

/** 선택한 장소의 다음 목적지. 위 3개 + Other n */
export function SessionFlowCard({ area, onBack }: { area: AreaId; onBack: () => void }) {
  const { t, locale } = useI18n();
  const { filters } = useMetricFilters(EXIT_RATE_FILTER);
  const explore = useExplore();
  const bd = useBreakdownView();
  const flow = getSessionFlow(filters, area);
  const c = t.dashboard.cards.sessionFlow;
  const topPlace = flow.destinations.find((d) => d.to !== "session_end")?.to;
  const categories = flow.destinations[0]?.breakdown?.map((b) => b.category) ?? [];
  return (
    <FlowCard
      title={c.title}
      info={t.dashboard.info.sessionFlow}
      backLabel={areaLabel(area)}
      onBack={onBack}
      sourceLabel={c.visitSessions}
      sourceValue={formatNumber(locale, flow.visitSessions)}
      headers={{ count: c.sessions, share: c.share }}
      rows={flow.destinations.map((d) => ({
        id: d.to,
        label: d.to === "session_end" ? c.sessionEnded : areaLabel(d.to),
        share: d.share,
        count: formatNumber(locale, d.sessions),
        percent: formatPercent(t, locale, d.share),
        tone: d.to === "session_end" ? "end" : d.to === topPlace ? "top" : "default",
        breakdown: bd.bars(flow.breakdown, d.breakdown?.map((b) => ({ category: b.category, value: b.share })) ?? null),
      }))}
      legend={bd.legend(flow.breakdown, categories, "bar")}
      visibleCount={3}
      otherLabel={c.other}
      onExplore={() => explore("sessionFlow", area)}
    />
  );
}

/** Exit rate + 아코디언 Session flow (Overview·Experience 공용) */
export function ExitRateWithFlow() {
  // 처음에는 닫혀 있고, 행을 누르면 Session flow가 열린다
  const [selected, setSelected] = usePersistentState<AreaId | null>("dash:exitRateSelected", null);
  return (
    <>
      <ExitRateCard selected={selected} onSelect={setSelected} />
      <Accordion open={selected !== null}>{selected && <SessionFlowCard area={selected} onBack={() => setSelected(null)} />}</Accordion>
    </>
  );
}

// ── Progression funnels ─────────────────────────────────────────────────────────
function stepLabel(t: Messages, step: FunnelStep, inStage: boolean) {
  const s = t.dashboard.funnel.steps;
  switch (step.kind) {
    case "lobbyEntered":
      return s.lobbyEntered;
    case "stageEntered":
      return inStage ? s.stageEnteredShort : s.stageEntered(step.stage);
    case "starEarned":
      return s.starEarned(step.star);
    case "stageCleared":
      return inStage ? s.stageClearedShort : s.stageCleared(step.stage);
  }
}

function useFunnelView(result: FunnelResult, inStage: boolean) {
  const { t, locale } = useI18n();
  const bd = useBreakdownView();
  const steps = funnelRows(result.steps.map((s) => s.users)).map((r, i) => ({
    ...r,
    label: stepLabel(t, result.steps[i].step, inStage),
    usersLabel: formatNumber(locale, r.users),
    reachLabel: formatPercent(t, locale, r.reachRate),
    dropLabel: r.dropOff === null ? null : formatPercent(t, locale, r.dropOff),
    // Breakdown: category별 첫 단계 대비 도달률
    breakdown: bd.bars(result.breakdown, result.steps[i].breakdown?.map((b) => ({ category: b.category, value: b.reachRate })) ?? null),
  }));
  const categories = result.steps[0]?.breakdown?.map((b) => b.category) ?? [];
  return { steps, legend: bd.legend(result.breakdown, categories, "bar") };
}

function useKpiFormat() {
  const { t, locale } = useI18n();
  const empty = t.dashboard.retention.empty;
  return {
    /** 비교 기간 데이터가 없으므로 delta = null → "— No comparison data" */
    item: (label: string, value: string, info?: string): KpiItemView => ({ label, value, info, delta: null, noComparison: t.dashboard.noComparison }),
    percent: (v: number | null) => (v === null ? empty : formatPercent(t, locale, v)),
    duration: (v: number | null) => (v === null ? empty : formatDuration(t, v)),
    decimal: (v: number | null) => (v === null ? empty : formatNumber(locale, v, 1)),
  };
}

export function StageProgressionCard() {
  const { t } = useI18n();
  const { filters, cardFilter } = useMetricFilters("stageProgression");
  const explore = useExplore();
  const groups = useCategoryGroups();
  const [stage, setStage] = usePersistentState<number>("dash:stage", dashboardDefaults.stage);
  const sp = getStageProgression(filters, stage);
  const { steps, legend } = useFunnelView(sp, true);
  const kf = useKpiFormat();
  const f = t.dashboard.funnel;
  return (
    <FunnelCard
      title={t.dashboard.cards.stageProgression.title}
      info={t.dashboard.info.stageProgression}
      tabs={{
        items: STAGES.map((s) => ({ id: String(s), label: areaLabel(`stage_${s}` as AreaId) })),
        selected: String(stage),
        onSelect: (id) => setStage(Number(id)),
      }}
      kpis={[
        kf.item(f.kpis.clearRate, kf.percent(sp.kpis.clearRate), t.dashboard.info.clearRate),
        kf.item(f.kpis.avgFirstClearTime, kf.duration(sp.kpis.avgFirstClearTimeSec), t.dashboard.info.firstClearTime),
        kf.item(f.kpis.avgFailuresToClear, kf.decimal(sp.kpis.avgFailuresToFirstClear), t.dashboard.info.failuresToClear),
      ]}
      sectionTitle={t.dashboard.cards.stageProgression.funnel}
      labels={{ step: f.step, users: f.users, dropOff: f.dropOff, reached: f.reached, dropped: f.dropped }}
      steps={steps}
      legend={legend}
      controls={groups}
      cardFilter={cardFilter}
      onExplore={() => explore("stageProgression", `stage_${stage}`)}
    />
  );
}

export function NewUserProgressionCard() {
  const { t } = useI18n();
  const { filters, cardFilter } = useMetricFilters("newUserProgression");
  const explore = useExplore();
  const groups = useCategoryGroups();
  const nup = getNewUserProgression(filters);
  const { steps, legend } = useFunnelView(nup, false);
  const kf = useKpiFormat();
  const f = t.dashboard.funnel;
  return (
    <FunnelCard
      title={t.dashboard.cards.newUserProgression.title}
      info={t.dashboard.info.newUserProgression}
      kpis={[
        kf.item(f.kpis.avgPlaytime, kf.duration(nup.kpis.avgPlaytimeSec)),
        kf.item(f.kpis.stageClearRate(nup.kpis.stageClearRate.stage), kf.percent(nup.kpis.stageClearRate.value)),
        kf.item(f.kpis.stageReachRate(nup.kpis.stageReachRate.stage), kf.percent(nup.kpis.stageReachRate.value)),
      ]}
      sectionTitle={t.dashboard.cards.newUserProgression.funnel}
      labels={{ step: f.step, users: f.users, dropOff: f.dropOff, reached: f.reached, dropped: f.dropped }}
      steps={steps}
      legend={legend}
      controls={groups}
      cardFilter={cardFilter}
      onExplore={() => explore("newUserProgression")}
    />
  );
}

// ── Retention: 날짜 코호트 → 진행도 코호트 (Breakdown 적용 안 함) ─────────────────
export function DateCohortCard({ selected, onSelect }: { selected: string | null; onSelect: (date: string | null) => void }) {
  const { t, locale } = useI18n();
  const { filters } = useMetricFilters();
  const explore = useExplore();
  const c = t.dashboard.cards.dateCohortRetention;
  return (
    <CohortCard
      title={c.title}
      info={t.dashboard.info.dateCohortRetention}
      rowHeader={c.rowHeader}
      usersHeader={t.dashboard.retention.users}
      dayLabels={Array.from({ length: RETENTION_MAX_DAY }, (_, i) => t.dashboard.retention.day(i + 1))}
      rows={getDateCohorts(filters).map((row) => ({ id: row.date, label: formatDay(locale, row.date), users: formatNumber(locale, row.users), values: row.retention }))}
      tone="accent"
      selectedId={selected}
      onSelect={(id) => onSelect(selected === id ? null : id)}
      onExplore={() => explore("dateCohortRetention", selected ?? undefined)}
      format={(v) => formatPercent(t, locale, v)}
    />
  );
}

export function ProgressionCohortCard({ date, onBack }: { date: string; onBack?: () => void }) {
  const { t, locale } = useI18n();
  const { filters } = useMetricFilters();
  const explore = useExplore();
  const c = t.dashboard.cards.progressionRetention;
  return (
    <CohortCard
      title={c.title}
      info={t.dashboard.info.progressionRetention}
      back={onBack ? { label: c.back(formatDay(locale, date)), onBack } : undefined}
      rowHeader={c.rowHeader}
      usersHeader={t.dashboard.retention.users}
      dayLabels={Array.from({ length: RETENTION_MAX_DAY }, (_, i) => t.dashboard.retention.day(i + 1))}
      rows={getProgressionCohorts(filters, date).map((row) => ({ id: row.area, label: areaLabel(row.area), users: formatNumber(locale, row.users), values: row.retention }))}
      tone="emphasis"
      onExplore={() => explore("progressionRetention", date)}
      format={(v) => formatPercent(t, locale, v)}
    />
  );
}

export function CohortRetentionWithProgression() {
  // 처음에는 닫혀 있고, 코호트 행을 누르면 Retention by progression이 열린다
  const [selected, setSelected] = usePersistentState<string | null>("dash:cohortSelected", null);
  return (
    <>
      <DateCohortCard selected={selected} onSelect={setSelected} />
      <Accordion open={selected !== null}>{selected && <ProgressionCohortCard date={selected} onBack={() => setSelected(null)} />}</Accordion>
    </>
  );
}

/** Explore에서 지표 하나를 그대로 연다 */
export function MetricCard({ metric, selection }: { metric: MetricId; selection?: string }) {
  const [flowArea] = useState<AreaId>(() =>
    AREAS.includes(selection as AreaId) ? (selection as AreaId) : (dashboardDefaults.exitRateArea ?? AREAS[0]),
  );
  switch (metric) {
    case "dailyActiveUsers":
      return <DailyActiveUsersCard />;
    case "playtime":
      return <PlaytimeCard />;
    case "sessions":
      return <SessionsCard />;
    case "sessionTime":
      return <SessionTimeCard />;
    case "newAndReturning":
      return <NewReturningUsersCard />;
    case "d1Retention":
      return <RetentionLineCard day="d1" />;
    case "d7Retention":
      return <RetentionLineCard day="d7" />;
    case "dateCohortRetention":
      return <CohortRetentionWithProgression />;
    case "progressionRetention":
      return <ProgressionCohortCard date={selection ?? dashboardDefaults.cohortDate ?? periodDates()[0]} />;
    case "exitRate":
      return <ExitRateWithFlow />;
    case "sessionFlow":
      return <SessionFlowCard area={flowArea} onBack={() => {}} />;
    case "stageProgression":
      return <StageProgressionCard />;
    case "newUserProgression":
      return <NewUserProgressionCard />;
  }
}
