// 대시보드 데이터 모양.
// raw dataset(data/dashboard/bounce-bounce.json)은 BounceBounce_DummyData_v5_final.xlsx를 정규화한 것 (npm run data).
// 화면은 lib/dashboard/queries.ts의 조회 함수 결과만 쓴다. 데이터에는 값만 두고, 문구·단위는 i18n.

import type { LoggingNodeId } from "@/data/types";

/** 게임 구조의 장소 (매핑 노드와 같은 id) */
export type AreaId = LoggingNodeId;
/** Session flow 목적지: 다른 장소 또는 세션 종료 */
export type FlowDestination = AreaId | "session_end";

export type DeviceCode = "mobile" | "pc" | "tablet" | "console";
/** 필터·Breakdown에서 고를 수 있는 대표 6개국 (그 외 국가는 All에만 포함) */
export type CountryCode = "us" | "br" | "mx" | "gb" | "ca" | "kr";
export type VisitType = "new" | "returning";
export type BreakdownValue = DeviceCode | CountryCode | VisitType;

export type TrafficSourceId = "homeRecommendations" | "search" | "youtube" | "instagram" | "unattributed";

// ── raw (정규화) ─────────────────────────────────────────────────────────────
export type RawPlayer = {
  id: string;
  firstSeenDate: string;
  device: DeviceCode;
  /** 실제 국가 코드 (JP, DE… 포함) */
  country: string;
  /** 대표 6개국이면 코드, 그 외는 null */
  countryFilter: CountryCode | null;
  /** 원본 값 (수정하지 않음) */
  acquisitionSourceSynthetic: string;
  /** UI 전용 파생 값 (Traffic sources) */
  acquisitionSourceUi: TrafficSourceId;
  highestStageClearedBeforeCove: number;
  furthestStageReachedBeforeCove: number;
};

export type RawSession = {
  id: string;
  playerId: string;
  date: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  device: DeviceCode;
  country: string;
  countryFilter: CountryCode | null;
  visitType: VisitType;
  isFirstSession: boolean;
  /** 세션이 끝난 장소 */
  exitArea: AreaId | null;
  /** 방문한 장소 순서 (Events의 lobby_entered / stage_entered, 연속 중복 제거) */
  path: AreaId[];
};

export type RawStageRun = {
  id: string;
  sessionId: string;
  playerId: string;
  stage: number;
  enteredAt: string;
  endedAt: string;
  durationSec: number;
  result: "completed" | "quit" | "returnLobby";
  attempts: number;
  failures: number;
  starsCollected: number;
  starsRequired: number;
  isReplay: boolean;
  device: DeviceCode;
  countryFilter: CountryCode | null;
  visitType: VisitType;
};

export type BounceBounceDataset = {
  meta: {
    source: string;
    /** 수집 시작일 */
    dataStart: string;
    periodStart: string;
    periodEnd: string;
    /** Overview "Today" */
    today: string;
    /** 데이터 최신 시각 (Data through) */
    dataThrough: string;
    lastEventAt: string;
    /** 기간(Last 7 days) 날짜 = Today 이전 완료된 7일 */
    dates: string[];
    /** 수집된 모든 날짜 (기간 + Today) */
    allDates: string[];
  };
  players: RawPlayer[];
  sessions: RawSession[];
  stageRuns: RawStageRun[];
};

// ── 필터 ────────────────────────────────────────────────────────────────────
/** 빈 배열 = 전체 (All). 같은 차원 안에서는 OR, 차원 사이는 AND */
export type DashboardFilters = {
  dateRange: "last7days" | "custom";
  device: DeviceCode[];
  visitType: VisitType[];
  country: CountryCode[];
  /** Breakdown으로 체크한 값 — 한 차원 안의 값만 (그 값들이 series가 된다) */
  breakdown: BreakdownValue[];
  interval: "days";
};

// ── 화면 공통 ───────────────────────────────────────────────────────────────
/** 증감. 비교 기간이 없으면 null → "— No comparison data" */
export type Delta = {
  direction: "up" | "down";
  value: number;
  unit: "percent" | "pp" | "seconds" | "count";
  tone: "positive" | "negative" | "neutral";
};

export type MetricUnit = "users" | "sessions" | "minutes" | "hours" | "percent";

export type FunnelStep =
  | { kind: "lobbyEntered" }
  | { kind: "stageEntered"; stage: number }
  | { kind: "starEarned"; stage: number; star: number }
  | { kind: "stageCleared"; stage: number };

/** Explore에서 열 수 있는 지표(카드) */
export type MetricId =
  | "dailyActiveUsers"
  | "playtime"
  | "sessions"
  | "sessionTime"
  | "newAndReturning"
  | "d1Retention"
  | "d7Retention"
  | "dateCohortRetention"
  | "progressionRetention"
  | "exitRate"
  | "sessionFlow"
  | "stageProgression"
  | "newUserProgression";

export type DashboardPage = "overview" | "engagement" | "retention" | "experience" | "explore";
