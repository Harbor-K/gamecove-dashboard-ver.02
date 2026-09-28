import type { DashboardFilters, DashboardPage, MetricId } from "@/data/dashboard/types";

// Explore 추천 질문 · AI 브리핑 · Ask COVY가 함께 쓰는 GameCove data context.
// AI는 이 context와 GameCove dummy dataset / game structure 안에서만 답한다 (없는 데이터·숫자를 만들지 않는다).

export type GameCoveContext = {
  /** 현재 페이지 */
  page: DashboardPage | "tracking";
  /** 보고 있던 지표(카드) */
  metric?: MetricId;
  /** 선택된 분석 대상 (예: 장소 "stage_2", 코호트 날짜 "2025-09-18") */
  selection?: string;
  filters?: DashboardFilters;
  /** 로깅(추적) 상태: 추적 중인 이벤트와 대기 중인 이벤트 */
  tracking?: { trackedEvents: string[]; pendingEvents: string[] };
  locale?: string;
};

export type RecommendedQuestions = { questions: string[]; source: "mock" | "llm" };

export type Briefing = { text: string; metric: MetricId; source: "mock" | "llm" };

export type CovyResponse =
  | { kind: "clarify"; status: string; question: string; options: string[]; source: "mock" | "llm" }
  | {
      kind: "answer";
      sections: { heading: string; paragraphs?: string[]; bullets?: string[] }[];
      followUps: string[];
      source: "mock" | "llm";
    };
