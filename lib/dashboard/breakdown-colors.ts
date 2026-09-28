// Breakdown series 공통 색 매핑. 모든 대시보드 차트가 이것만 쓴다 (컴포넌트에서 색을 직접 정하지 않는다).
// 카테고리 → CSS 변수(app/breakdown-colors.css, 다크·라이트 두 테마). 순서나 필터와 상관없이 항상 같은 색.

export type BreakdownDimension = "device" | "country" | "visitType";

export const BREAKDOWN_SERIES_COLORS = {
  device: {
    mobile: "--gc-chart-breakdown-mobile",
    pc: "--gc-chart-breakdown-pc",
    tablet: "--gc-chart-breakdown-tablet",
    console: "--gc-chart-breakdown-console",
  },
  country: {
    us: "--gc-chart-breakdown-us",
    br: "--gc-chart-breakdown-br",
    mx: "--gc-chart-breakdown-mx",
    gb: "--gc-chart-breakdown-gb",
    ca: "--gc-chart-breakdown-ca",
    kr: "--gc-chart-breakdown-kr",
  },
  visitType: {
    new: "--gc-chart-breakdown-new",
    returning: "--gc-chart-breakdown-returning",
  },
} as const satisfies Record<BreakdownDimension, Record<string, string>>;

export type BreakdownCategory<D extends BreakdownDimension> = keyof (typeof BREAKDOWN_SERIES_COLORS)[D];

/** 카테고리의 색 (CSS 변수 이름). Breakdown이 없을 때는 기존 single-series 색(chart/series/primary)을 쓴다 */
export function breakdownColor<D extends BreakdownDimension>(dimension: D, category: BreakdownCategory<D>): string {
  return BREAKDOWN_SERIES_COLORS[dimension][category] as string;
}
