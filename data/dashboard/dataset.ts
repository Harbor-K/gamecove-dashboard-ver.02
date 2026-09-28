import raw from "./bounce-bounce.json";
import type { AreaId, BounceBounceDataset, DashboardPage, MetricId } from "./types";

// 대시보드의 single source of truth: BounceBounce_DummyData_v5_final.xlsx를 정규화한 dataset (npm run data로 생성).
// 화면은 이 파일을 직접 쓰지 않고 lib/dashboard/queries.ts의 조회 함수로만 읽는다.
export const dataset = raw as BounceBounceDataset;

/** 처음 열었을 때 선택돼 있는 대상 (Figma 기본 화면). null = 선택 없음 */
export const dashboardDefaults: { exitRateArea: AreaId | null; cohortDate: string | null; stage: number } = {
  exitRateArea: "stage_2",
  cohortDate: "2026-09-18",
  stage: 2,
};

/** Overview KPI를 누르면 가는 곳 */
export const overviewKpiTargets: Record<
  "dailyActiveUsers" | "newActiveUsers" | "averagePlaytime" | "d1Retention",
  { page: DashboardPage; metric: MetricId }
> = {
  dailyActiveUsers: { page: "engagement", metric: "dailyActiveUsers" },
  newActiveUsers: { page: "engagement", metric: "newAndReturning" },
  averagePlaytime: { page: "engagement", metric: "playtime" },
  d1Retention: { page: "retention", metric: "d1Retention" },
};

/** 필터·Breakdown 선택지 (표시 순서) */
export const filterOptions = {
  device: ["mobile", "tablet", "pc", "console"] as const,
  visitType: ["new", "returning"] as const,
  country: ["us", "ca", "br", "mx", "gb", "kr"] as const,
};

/** Traffic sources 표시 순서 */
export const trafficSourceOrder = ["homeRecommendations", "search", "youtube", "instagram", "unattributed"] as const;
