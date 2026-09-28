import { dataset, filterOptions, trafficSourceOrder } from "@/data/dashboard/dataset";
import type {
  AreaId,
  BreakdownValue,
  CountryCode,
  DashboardFilters,
  Delta,
  DeviceCode,
  FlowDestination,
  FunnelStep,
  MetricUnit,
  RawSession,
  RawStageRun,
  TrafficSourceId,
  VisitType,
} from "@/data/dashboard/types";

// 대시보드 조회 함수 (query / selector layer).
// raw dataset(Players / Sessions / StageRuns / 세션 이동 경로)에서 필터를 먼저 적용한 뒤 계산한다.
// 카드는 여기 결과만 받아서 표시한다 — 카드 안에서 계산하지 않는다. Explore·AI Agent도 같은 함수를 쓴다.
// 데이터에 없는 값은 만들지 않는다: 계산할 수 없으면 null (화면에서 N/A / No data / —).

export const defaultFilters: DashboardFilters = {
  dateRange: "last7days",
  device: [],
  visitType: [],
  country: [],
  breakdown: [],
  interval: "days",
};

export const AREAS: AreaId[] = ["lobby", "stage_1", "stage_2", "stage_3", "stage_4"];
export const STAGES = [1, 2, 3, 4];

// ── 기간 · 필터 ──────────────────────────────────────────────────────────────
/** 선택 기간의 날짜 (지금은 Last 7 days = 수집 기간 전체만 있다) */
export function periodDates(filters: DashboardFilters = defaultFilters): string[] {
  void filters.dateRange;
  return dataset.meta.dates;
}

export const dataThrough = () => dataset.meta.dataThrough;
export const today = () => dataset.meta.today;

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dayOf = (isoDateTime: string) => isoDateTime.slice(0, 10);

type Segment = { device: DeviceCode; countryFilter: CountryCode | null; visitType: VisitType };

/** 필터 조건 (빈 배열 = 전체). ignore로 특정 차원은 빼고 적용할 수 있다 */
function matches(row: Segment, f: DashboardFilters, ignore: { visitType?: boolean } = {}) {
  if (f.device.length && !f.device.includes(row.device)) return false;
  if (f.country.length && (!row.countryFilter || !f.country.includes(row.countryFilter))) return false;
  if (!ignore.visitType && f.visitType.length && !f.visitType.includes(row.visitType)) return false;
  return true;
}

function filteredSessions(f: DashboardFilters, ignore: { visitType?: boolean } = {}): RawSession[] {
  const dates = new Set(periodDates(f));
  return dataset.sessions.filter((s) => dates.has(s.date) && matches(s, f, ignore));
}

function filteredRuns(f: DashboardFilters): RawStageRun[] {
  const dates = new Set(periodDates(f));
  return dataset.stageRuns.filter((r) => dates.has(dayOf(r.enteredAt)) && matches(r, f));
}

// ── Breakdown ────────────────────────────────────────────────────────────────
export type BreakdownDimension = "device" | "country" | "visitType";

export function dimensionOf(value: BreakdownValue): BreakdownDimension {
  if ((filterOptions.device as readonly string[]).includes(value)) return "device";
  if ((filterOptions.country as readonly string[]).includes(value)) return "country";
  return "visitType";
}

/** 체크한 Breakdown 값 → 차원과 series 순서 (선택지 표시 순서로 고정) */
export function resolveBreakdown(f: DashboardFilters): { dimension: BreakdownDimension; categories: BreakdownValue[] } | null {
  if (!f.breakdown.length) return null;
  const dimension = dimensionOf(f.breakdown[0]);
  const categories = (filterOptions[dimension] as readonly BreakdownValue[]).filter((v) => f.breakdown.includes(v));
  return { dimension, categories };
}

function categoryOf(row: Segment, dimension: BreakdownDimension): BreakdownValue | null {
  return dimension === "device" ? row.device : dimension === "country" ? row.countryFilter : row.visitType;
}

/** rows를 category별로 나눈다 (Breakdown series용) */
function splitBy<T extends Segment>(rows: T[], bd: NonNullable<ReturnType<typeof resolveBreakdown>>) {
  return bd.categories.map((category) => ({ category, rows: rows.filter((r) => categoryOf(r, bd.dimension) === category) }));
}

// ── 공통 결과 모양 ────────────────────────────────────────────────────────────
export type Series = { key: string; category: BreakdownValue | null; values: (number | null)[] };

export type LineResult = {
  dates: string[];
  /** Breakdown이 없으면 series 하나 (category = null) */
  series: Series[];
  breakdown: BreakdownDimension | null;
  /** 머리 숫자: 필터 적용 값의 날짜별 평균 (관측 불가 날짜 제외). 계산 불가면 null */
  headline: number | null;
  unit: MetricUnit;
  decimals: number;
  axisMax: number;
};

const mean = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x !== null && Number.isFinite(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

/** 축 최댓값: 가장 큰 값의 약 1.2배를 5칸으로 나누기 좋은 수로 올림 */
export function niceAxisMax(values: (number | null)[], unit: MetricUnit) {
  const max = Math.max(0, ...values.filter((x): x is number => x !== null));
  if (max === 0) return unit === "percent" ? 10 : 5;
  const rawStep = (max * 1.2) / 5;
  const pow = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rawStep) ?? rawStep;
  return step * 5;
}

/** 날짜별 지표 (세션 기반). compute(그날 세션) → 값 */
function dailyLine(
  f: DashboardFilters,
  unit: MetricUnit,
  decimals: number,
  compute: (sessions: RawSession[]) => number | null,
): LineResult {
  const dates = periodDates(f);
  const sessions = filteredSessions(f);
  const byDay = (rows: RawSession[]) => dates.map((d) => compute(rows.filter((s) => s.date === d)));
  const total = byDay(sessions);
  const bd = resolveBreakdown(f);
  const series: Series[] = bd
    ? splitBy(sessions, bd).map(({ category, rows }) => ({ key: category, category, values: byDay(rows) }))
    : [{ key: "total", category: null, values: total }];
  return {
    dates,
    series,
    breakdown: bd?.dimension ?? null,
    headline: mean(total),
    unit,
    decimals,
    axisMax: niceAxisMax(series.flatMap((s) => s.values), unit),
  };
}

const uniquePlayers = (sessions: RawSession[]) => new Set(sessions.map((s) => s.playerId)).size;
const sumDuration = (sessions: RawSession[]) => sessions.reduce((a, s) => a + s.durationSec, 0);
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

// ── Engagement ──────────────────────────────────────────────────────────────
/** 날짜별 활성 플레이어 (unique) */
export const getDailyActiveUsers = (f: DashboardFilters) =>
  dailyLine(f, "users", 0, (s) => (s.length ? uniquePlayers(s) : null));

/** Average = 그날 총 플레이 시간 ÷ DAU (분), Total = 그날 총 플레이 시간 (시간) */
export const getPlaytime = (f: DashboardFilters, mode: "average" | "total") =>
  mode === "average"
    ? dailyLine(f, "minutes", 1, (s) => {
        const r = ratio(sumDuration(s), uniquePlayers(s));
        return r === null ? null : r / 60;
      })
    : dailyLine(f, "hours", 1, (s) => (s.length ? sumDuration(s) / 3600 : null));

/** Per user = 세션 수 ÷ DAU, Total = 세션 수 */
export const getSessions = (f: DashboardFilters, mode: "perUser" | "total") =>
  mode === "perUser"
    ? dailyLine(f, "sessions", 1, (s) => ratio(s.length, uniquePlayers(s)))
    : dailyLine(f, "sessions", 0, (s) => (s.length ? s.length : null));

/** 평균 세션 시간 = 총 플레이 시간 ÷ 세션 수 (분) */
export const getAverageSessionTime = (f: DashboardFilters) =>
  dailyLine(f, "minutes", 1, (s) => {
    const r = ratio(sumDuration(s), s.length);
    return r === null ? null : r / 60;
  });

/**
 * New and returning users: 날짜별 New / Returning 플레이어 (unique, 세션 visit_type 기준).
 * 이미 신규·재방문으로 나뉜 카드라 페이지 필터·Breakdown을 적용하지 않는다 (디자이너 결정).
 */
export function getNewReturning(f: DashboardFilters = defaultFilters) {
  const dates = periodDates(f);
  const inPeriod = new Set(dates);
  const sessions = dataset.sessions.filter((s) => inPeriod.has(s.date));
  const line = (type: VisitType) =>
    dates.map((d) => {
      const s = sessions.filter((x) => x.date === d && x.visitType === type);
      return s.length ? uniquePlayers(s) : null;
    });
  const values = { new: line("new"), returning: line("returning") };
  return {
    dates,
    values,
    headline: { new: mean(values.new), returning: mean(values.returning) },
    axisMax: niceAxisMax([...values.new, ...values.returning], "users"),
  };
}

/** Traffic sources: New / Returning 토글에 맞춰 그 플레이어들의 유입 경로 비율 (필터·Breakdown 적용 안 함) */
export function getTrafficSources(type: VisitType, f: DashboardFilters = defaultFilters) {
  const inPeriod = new Set(periodDates(f));
  const ids = new Set(dataset.sessions.filter((s) => inPeriod.has(s.date) && s.visitType === type).map((s) => s.playerId));
  const players = dataset.players.filter((p) => ids.has(p.id));
  const counts = new Map<TrafficSourceId, number>();
  for (const p of players) counts.set(p.acquisitionSourceUi, (counts.get(p.acquisitionSourceUi) ?? 0) + 1);
  const total = players.length;
  return trafficSourceOrder.map((id) => ({
    id,
    players: counts.get(id) ?? 0,
    share: total ? ((counts.get(id) ?? 0) / total) * 100 : null,
  }));
}

// ── Retention ───────────────────────────────────────────────────────────────
/** 신규 코호트: 그 날짜에 처음 플레이한 플레이어 (기기·국가 필터 적용, New/Returning 필터는 신규만 해당) */
function cohortPlayers(date: string, f: DashboardFilters) {
  // 수집 시작 전 날짜의 cohort는 첫날 기록이 없어(돌아온 사람만 남음) 계산하지 않는다
  if (date < dataset.meta.dataStart) return [];
  if (f.visitType.length && !f.visitType.includes("new")) return [];
  return dataset.players.filter(
    (p) =>
      p.firstSeenDate === date &&
      matches({ device: p.device, countryFilter: p.countryFilter, visitType: "new" }, f, { visitType: true }),
  );
}

const activeByDate = (() => {
  const map = new Map<string, Set<string>>();
  for (const s of dataset.sessions) {
    const set = map.get(s.date) ?? new Set<string>();
    set.add(s.playerId);
    map.set(s.date, set);
  }
  return map;
})();

/**
 * 코호트의 Dn 리텐션 (%). 아직 관측할 수 없는 날(데이터 마지막 날 = Today 이후)이거나 코호트가 없으면 null.
 * Today(Day 8)는 저녁까지의 부분 일자지만 관측된 날로 본다 (Today D1 KPI = 어제 신규 중 오늘 돌아온 비율).
 */
function retentionRate(players: { id: string }[], cohortDate: string, n: number): number | null {
  const target = addDays(cohortDate, n);
  if (target > dataset.meta.today || !players.length) return null;
  const active = activeByDate.get(target) ?? new Set();
  return (players.filter((p) => active.has(p.id)).length / players.length) * 100;
}

/**
 * Day N retention 선 차트: 코호트 날짜별 DN. 머리 숫자 = 관측 가능한 날짜별 값의 산술평균
 * (기간 전체를 합친 pooled 값이 아니다 — Roblox Analytics와 같은 "Daily average over selected period").
 */
export function getRetention(f: DashboardFilters, day: 1 | 7): LineResult {
  const dates = periodDates(f);
  const bd = resolveBreakdown(f);
  const total = dates.map((d) => retentionRate(cohortPlayers(d, f), d, day));
  const series: Series[] = bd
    ? bd.categories.map((category) => ({
        key: category,
        category,
        values: dates.map((d) =>
          retentionRate(
            cohortPlayers(d, f).filter((p) => categoryOf({ device: p.device, countryFilter: p.countryFilter, visitType: "new" }, bd.dimension) === category),
            d,
            day,
          ),
        ),
      }))
    : [{ key: "total", category: null, values: total }];
  return {
    dates,
    series,
    breakdown: bd?.dimension ?? null,
    headline: mean(total),
    unit: "percent",
    decimals: 1,
    axisMax: niceAxisMax(series.flatMap((s) => s.values), "percent"),
  };
}

export const RETENTION_MAX_DAY = 10;

/** Date cohort retention 표 (최신 날짜가 위). 관측 안 된 칸은 null (—) */
export function getDateCohorts(f: DashboardFilters) {
  return [...periodDates(f)].reverse().map((date) => {
    const players = cohortPlayers(date, f);
    return {
      date,
      users: players.length,
      retention: Array.from({ length: RETENTION_MAX_DAY }, (_, i) => retentionRate(players, date, i + 1)),
    };
  });
}

/** Retention by progression: 코호트를 첫날 가장 멀리 간 장소로 나눈다 */
export function getProgressionCohorts(f: DashboardFilters, date: string) {
  const players = cohortPlayers(date, f);
  const furthest = new Map<string, AreaId>();
  for (const p of players) furthest.set(p.id, "lobby");
  for (const r of dataset.stageRuns) {
    if (!furthest.has(r.playerId) || dayOf(r.enteredAt) !== date) continue;
    const current = furthest.get(r.playerId)!;
    const currentStage = current === "lobby" ? 0 : Number(current.split("_")[1]);
    if (r.stage > currentStage) furthest.set(r.playerId, `stage_${r.stage}` as AreaId);
  }
  return AREAS.map((area) => {
    const group = players.filter((p) => furthest.get(p.id) === area);
    return {
      area,
      users: group.length,
      retention: Array.from({ length: RETENTION_MAX_DAY }, (_, i) => retentionRate(group, date, i + 1)),
    };
  });
}

// ── Experience ──────────────────────────────────────────────────────────────
function exitRates(sessions: RawSession[]) {
  return AREAS.map((area) => {
    const visited = sessions.filter((s) => s.path.includes(area));
    const exits = visited.filter((s) => s.exitArea === area).length;
    return { area, visits: visited.length, exits, rate: visited.length ? (exits / visited.length) * 100 : null };
  });
}

/** Exit rate: 그 장소를 방문한 세션 중 거기서 끝난 비율 */
export function getExitRate(f: DashboardFilters) {
  const sessions = filteredSessions(f);
  const rows = exitRates(sessions);
  const bd = resolveBreakdown(f);
  const byCategory = bd ? splitBy(sessions, bd).map(({ category, rows: s }) => ({ category, rows: exitRates(s) })) : null;
  return {
    rows: rows.map((r, i) => ({
      ...r,
      breakdown: byCategory?.map((c) => ({ category: c.category, rate: c.rows[i].rate })) ?? null,
    })),
    breakdown: bd?.dimension ?? null,
  };
}

function flowCounts(sessions: RawSession[], area: AreaId) {
  const visited = sessions.filter((s) => s.path.includes(area));
  const counts = new Map<FlowDestination, number>();
  for (const s of visited) {
    // 세션에서 처음 방문한 뒤의 다음 목적지 하나만 (같은 세션 재방문은 세지 않음)
    const next = s.path[s.path.indexOf(area) + 1] ?? "session_end";
    counts.set(next, (counts.get(next) ?? 0) + 1);
  }
  return { visitSessions: visited.length, counts };
}

/** Session flow: 선택한 장소를 방문한 세션(1회씩)의 다음 목적지. 목적지 합계 = Visit sessions */
export function getSessionFlow(f: DashboardFilters, area: AreaId) {
  const sessions = filteredSessions(f);
  const { visitSessions, counts } = flowCounts(sessions, area);
  const bd = resolveBreakdown(f);
  const byCategory = bd ? splitBy(sessions, bd).map(({ category, rows }) => ({ category, ...flowCounts(rows, area) })) : null;
  const destinations = [...counts.entries()]
    .map(([to, n]) => ({
      to,
      sessions: n,
      share: visitSessions ? (n / visitSessions) * 100 : 0,
      breakdown:
        byCategory?.map((c) => ({
          category: c.category,
          share: c.visitSessions ? ((c.counts.get(to) ?? 0) / c.visitSessions) * 100 : null,
        })) ?? null,
    }))
    .sort((a, b) => b.sessions - a.sessions);
  return { visitSessions, destinations, breakdown: bd?.dimension ?? null };
}

export type FunnelResult = {
  steps: { step: FunnelStep; users: number; breakdown: { category: BreakdownValue; users: number; reachRate: number | null }[] | null }[];
  breakdown: BreakdownDimension | null;
};

/** 퍼널 단계별 고유 플레이어 (+ Breakdown이면 category별) */
function funnel(
  rows: { playerId: string; segment: Segment }[],
  steps: { step: FunnelStep; reached: (playerId: string) => boolean }[],
  bd: ReturnType<typeof resolveBreakdown>,
): FunnelResult {
  const players = new Map(rows.map((r) => [r.playerId, r.segment]));
  const count = (ids: string[], reached: (id: string) => boolean) => ids.filter(reached).length;
  const all = [...players.keys()];
  const groups = bd?.categories.map((category) => ({
    category,
    ids: all.filter((id) => categoryOf(players.get(id)!, bd.dimension) === category),
  }));
  return {
    steps: steps.map((s) => ({
      step: s.step,
      users: count(all, s.reached),
      breakdown:
        groups?.map((g) => {
          // 첫 단계 인원이 없으면 도달률을 계산할 수 없다 (0%가 아니라 null)
          const base = count(g.ids, steps[0].reached);
          return { category: g.category, users: count(g.ids, s.reached), reachRate: base ? (count(g.ids, s.reached) / base) * 100 : null };
        }) ?? null,
    })),
    breakdown: bd?.dimension ?? null,
  };
}

/**
 * Stage progression (고유 플레이어): 진입 → 별 1…n → 클리어.
 * Avg. first-clear time = 첫 진입부터 첫 클리어까지의 run 시간 합(실패·재시도 포함)의 평균.
 * 대상은 Cove 이전에 이 Stage를 깨지 않았고 기간 안에 첫 클리어가 관측된 플레이어.
 */
export function getStageProgression(f: DashboardFilters, stage: number) {
  const runs = filteredRuns(f).filter((r) => r.stage === stage);
  const byPlayer = new Map<string, RawStageRun[]>();
  for (const r of runs) byPlayer.set(r.playerId, [...(byPlayer.get(r.playerId) ?? []), r]);
  const starsRequired = Math.max(0, ...runs.map((r) => r.starsRequired));
  const maxStars = (id: string) => Math.max(0, ...(byPlayer.get(id) ?? []).map((r) => r.starsCollected));
  const cleared = (id: string) => (byPlayer.get(id) ?? []).some((r) => r.result === "completed");

  const steps: { step: FunnelStep; reached: (id: string) => boolean }[] = [
    { step: { kind: "stageEntered", stage }, reached: (id) => byPlayer.has(id) },
    ...Array.from({ length: starsRequired }, (_, i) => ({
      step: { kind: "starEarned", stage, star: i + 1 } as FunnelStep,
      reached: (id: string) => maxStars(id) >= i + 1,
    })),
    { step: { kind: "stageCleared", stage }, reached: cleared },
  ];
  const result = funnel(
    [...byPlayer.entries()].map(([playerId, rs]) => ({ playerId, segment: rs[0] })),
    steps,
    resolveBreakdown(f),
  );

  // 첫 클리어
  const player = new Map(dataset.players.map((p) => [p.id, p]));
  const firstClear: { sec: number; failures: number }[] = [];
  for (const [id, rs] of byPlayer) {
    if ((player.get(id)?.highestStageClearedBeforeCove ?? 0) >= stage) continue;
    const sorted = [...rs].sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));
    const idx = sorted.findIndex((r) => r.result === "completed");
    if (idx < 0) continue;
    const upTo = sorted.slice(0, idx + 1);
    firstClear.push({ sec: upTo.reduce((a, r) => a + r.durationSec, 0), failures: upTo.reduce((a, r) => a + r.failures, 0) });
  }
  const entered = result.steps[0].users;
  const clearedUsers = result.steps[result.steps.length - 1].users;
  return {
    ...result,
    kpis: {
      clearRate: entered ? (clearedUsers / entered) * 100 : null,
      avgFirstClearTimeSec: mean(firstClear.map((x) => x.sec)),
      avgFailuresToFirstClear: mean(firstClear.map((x) => x.failures)),
      firstClearPlayers: firstClear.length,
      /** 비교 기간 데이터가 없다 */
      comparison: null,
    },
  };
}

/** New user progression: 신규 플레이어의 첫 세션 안에서 Lobby → Stage 1 진입 → Star 1 → Stage 1 클리어 → Stage 2 진입 */
export function getNewUserProgression(f: DashboardFilters) {
  const first = filteredSessions(f).filter((s) => s.isFirstSession);
  const runsBySession = new Map<string, RawStageRun[]>();
  for (const r of dataset.stageRuns) runsBySession.set(r.sessionId, [...(runsBySession.get(r.sessionId) ?? []), r]);
  const sessionOf = new Map(first.map((s) => [s.playerId, s]));
  const runsOf = (id: string) => runsBySession.get(sessionOf.get(id)?.id ?? "") ?? [];
  const stage1 = (id: string) => runsOf(id).filter((r) => r.stage === 1);

  const steps: { step: FunnelStep; reached: (id: string) => boolean }[] = [
    { step: { kind: "lobbyEntered" }, reached: (id) => sessionOf.get(id)?.path.includes("lobby") ?? false },
    { step: { kind: "stageEntered", stage: 1 }, reached: (id) => stage1(id).length > 0 },
    { step: { kind: "starEarned", stage: 1, star: 1 }, reached: (id) => stage1(id).some((r) => r.starsCollected >= 1) },
    { step: { kind: "stageCleared", stage: 1 }, reached: (id) => stage1(id).some((r) => r.result === "completed") },
    { step: { kind: "stageEntered", stage: 2 }, reached: (id) => runsOf(id).some((r) => r.stage === 2) },
  ];
  const result = funnel(
    first.map((s) => ({ playerId: s.playerId, segment: s })),
    steps,
    resolveBreakdown(f),
  );
  const total = result.steps[0].users;
  return {
    ...result,
    kpis: {
      avgPlaytimeSec: mean(first.map((s) => s.durationSec)),
      stageClearRate: { stage: 1, value: total ? (result.steps[3].users / total) * 100 : null },
      stageReachRate: { stage: 2, value: total ? (result.steps[4].users / total) * 100 : null },
      comparison: null,
    },
  };
}

// ── Overview (Today vs previous 7 days) ─────────────────────────────────────
/** 하루의 Overview 값 (DAU · 신규 · 평균 플레이 시간(분) · D1 = 전날 신규 중 그날 돌아온 비율) */
function dayKpis(day: string) {
  const sessions = dataset.sessions.filter((s) => s.date === day);
  const dau = uniquePlayers(sessions);
  const activeIds = new Set(sessions.map((s) => s.playerId));
  const yesterday = addDays(day, -1);
  const cohort = yesterday < dataset.meta.dataStart ? [] : dataset.players.filter((p) => p.firstSeenDate === yesterday);
  return {
    dailyActiveUsers: dau,
    newActiveUsers: dataset.players.filter((p) => p.firstSeenDate === day && activeIds.has(p.id)).length,
    averagePlaytime: dau ? sumDuration(sessions) / dau / 60 : null,
    d1Retention: retentionRate(cohort, yesterday, 1),
    cohortSize: cohort.length,
  };
}

/** 비교: Today 값과 previous 7 days(날짜별 값의 평균, 계산 불가 날짜 제외)의 차이. 비교할 값이 없으면 null */
function compare(today: number | null, previous: (number | null)[], unit: "percent" | "pp"): Delta | null {
  const base = mean(previous);
  if (today === null || base === null || (unit === "percent" && base === 0)) return null;
  const diff = unit === "percent" ? ((today - base) / base) * 100 : today - base;
  return { direction: diff >= 0 ? "up" : "down", value: Math.abs(diff), unit, tone: diff >= 0 ? "positive" : "negative" };
}

/**
 * Overview KPI: Today(데이터 마지막 날, UT 시점 Day 8 저녁까지) vs previous 7 days(Day 1~7 = 대시보드 기간).
 * previous 값 = 그 7일 각 날짜 값의 평균. D1은 cohort가 수집 기간 안에 있는 날짜만 (Day 1의 D1은 cohort가 없어 제외).
 */
export function getOverviewKpis() {
  const day = dataset.meta.today;
  const t = dayKpis(day);
  const prev = dataset.meta.dates.map(dayKpis);
  const series = <K extends keyof ReturnType<typeof dayKpis>>(k: K) => prev.map((p) => p[k] as number | null);
  return {
    date: day,
    dailyActiveUsers: { value: t.dailyActiveUsers, previous: mean(series("dailyActiveUsers")), comparison: compare(t.dailyActiveUsers, series("dailyActiveUsers"), "percent") },
    newActiveUsers: { value: t.newActiveUsers, previous: mean(series("newActiveUsers")), comparison: compare(t.newActiveUsers, series("newActiveUsers"), "percent") },
    /** 분 */
    averagePlaytime: { value: t.averagePlaytime, previous: mean(series("averagePlaytime")), comparison: compare(t.averagePlaytime, series("averagePlaytime"), "percent") },
    /** 어제 신규 중 오늘 다시 플레이한 비율 (%). 비교는 %p */
    d1Retention: {
      value: t.d1Retention,
      cohortSize: t.cohortSize,
      previous: mean(series("d1Retention")),
      comparison: compare(t.d1Retention, series("d1Retention"), "pp"),
    },
  };
}

// ── 화면 계산 도우미 (값 → 표시용) ──────────────────────────────────────────
export type FunnelRowView = {
  users: number;
  /** 첫 단계 대비 도달률 (%) */
  reachRate: number;
  /** 이전 단계 대비 이탈률 (%). 첫 단계는 null */
  dropOff: number | null;
  /** 이전 단계 도달률 (이탈 구간 끝) */
  previousReach: number;
  /** 가장 많이 이탈한 단계 */
  isMaxDrop: boolean;
};

/** 퍼널 행: 도달률·이탈률은 users로 계산 */
export function funnelRows(users: number[]): FunnelRowView[] {
  const first = users[0] || 1;
  const drops = users.map((u, i) => (i === 0 || !users[i - 1] ? null : (1 - u / users[i - 1]) * 100));
  const maxDrop = Math.max(...drops.map((d) => d ?? -1));
  return users.map((u, i) => ({
    users: u,
    reachRate: (u / first) * 100,
    dropOff: drops[i],
    previousReach: i === 0 ? 100 : (users[i - 1] / first) * 100,
    isMaxDrop: drops[i] !== null && drops[i] === maxDrop && maxDrop > 0,
  }));
}

/**
 * 히트맵 셀 opacity: 표 안 값에 선형으로 매핑 (CLAUDE.md 히트맵 규칙).
 * 최솟값 → 24%(accent) / 15%(emphasis), 최댓값 → 70%.
 */
export function heatOpacity(value: number, min: number, max: number, tone: "accent" | "emphasis") {
  const low = tone === "accent" ? 0.24 : 0.15;
  if (max <= min) return 0.7;
  return low + ((value - min) / (max - min)) * (0.7 - low);
}
