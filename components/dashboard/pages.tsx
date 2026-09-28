"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAgent } from "@/components/agent/agent-provider";
import { SparkIcon } from "@/components/icons";
import type { MetricId } from "@/data/dashboard/types";
import { fetchRecommendedQuestions } from "@/lib/ai/client";
import type { Briefing, GameCoveContext } from "@/lib/ai/context";
import { useI18n } from "@/lib/i18n";
import {
  CohortRetentionWithProgression,
  FilterScopeProvider,
  DailyActiveUsersCard,
  ExitRateWithFlow,
  MetricCard,
  NewReturningUsersCard,
  NewUserProgressionCard,
  PlaytimeCard,
  RetentionLineCard,
  SessionsCard,
  SessionTimeCard,
  StageProgressionCard,
} from "./metric-cards";
import { AiBriefing, KpiRow } from "./overview-parts";
import { DashboardPageLayout, FiltersBar, PageHeader, useDashboardFilters } from "./page-chrome";

// 대시보드 페이지 (Figma Page / Overview · Engagement · Retention · Experience · Explore). 카드 사이 48.

export function OverviewPage({ briefings }: { briefings: Partial<Record<string, Briefing>> }) {
  const { t } = useI18n();
  const p = t.dashboard.pages.overview;
  return (
    <DashboardPageLayout>
      <PageHeader title={p.title} description={p.description} />
      <AiBriefing briefings={briefings} />
      <KpiRow />
      <ExitRateWithFlow />
      <NewUserProgressionCard />
    </DashboardPageLayout>
  );
}

function TwoColumns({ children }: { children: React.ReactNode }) {
  // 필터 드로어·AI Agent가 옆에 떠도 2열 유지. 본문이 아주 좁을 때만 1열
  return <div className="grid w-full grid-cols-1 gap-12 @min-[960px]:grid-cols-2">{children}</div>;
}

/** Overview KPI에서 넘어오면(?focus=지표) 그 카드를 화면 가운데로 */
function useFocusMetric() {
  useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (!focus) return;
    const id = setTimeout(() => {
      document.querySelector(`[data-metric="${focus}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 150);
    return () => clearTimeout(id);
  }, []);
}

/** 지표 카드 자리 (focus 스크롤 대상) */
function Slot({ metric, children }: { metric: MetricId; children: React.ReactNode }) {
  return (
    <div data-metric={metric} className="min-w-0">
      {children}
    </div>
  );
}

export function EngagementPage() {
  const { t } = useI18n();
  useFocusMetric();
  const p = t.dashboard.pages.engagement;
  return (
    <DashboardPageLayout>
      <PageHeader title={p.title} description={p.description} />
      <FiltersBar />
      <FilterScopeProvider scope="page">
        <TwoColumns>
          <Slot metric="dailyActiveUsers">
            <DailyActiveUsersCard />
          </Slot>
          <Slot metric="playtime">
            <PlaytimeCard />
          </Slot>
          <Slot metric="sessions">
            <SessionsCard />
          </Slot>
          <Slot metric="sessionTime">
            <SessionTimeCard />
          </Slot>
        </TwoColumns>
        <Slot metric="newAndReturning">
          <NewReturningUsersCard />
        </Slot>
      </FilterScopeProvider>
    </DashboardPageLayout>
  );
}

export function RetentionPage() {
  const { t } = useI18n();
  useFocusMetric();
  const p = t.dashboard.pages.retention;
  return (
    <DashboardPageLayout>
      <PageHeader title={p.title} description={p.description} />
      <FiltersBar />
      <FilterScopeProvider scope="page">
        <TwoColumns>
          <Slot metric="d1Retention">
            <RetentionLineCard day="d1" />
          </Slot>
          <Slot metric="d7Retention">
            <RetentionLineCard day="d7" />
          </Slot>
        </TwoColumns>
        <CohortRetentionWithProgression />
      </FilterScopeProvider>
    </DashboardPageLayout>
  );
}

export function ExperiencePage() {
  const { t } = useI18n();
  const p = t.dashboard.pages.experience;
  return (
    <DashboardPageLayout>
      <PageHeader title={p.title} description={p.description} />
      {/* 페이지 필터·Breakdown 없음 — 카드 안 Filter by만 쓴다 (디자이너 결정) */}
      <ExitRateWithFlow />
      <StageProgressionCard />
      <NewUserProgressionCard />
    </DashboardPageLayout>
  );
}

/**
 * Figma "Page / Explore - 선택된 지표": 제목 아래 AI 추천 질문 (gap12), 기간·필터, 그 아래 60에 누른 지표 카드.
 * 추천 질문은 getRecommendedQuestions(context) — 지금은 dataset 기반 mock. 누르면 같은 context로 AI Agent가 답한다.
 */
export function ExplorePage() {
  const params = useSearchParams();
  const metric = (params.get("metric") as MetricId | null) ?? undefined;
  const selection = params.get("selection") ?? undefined;
  const { t, locale } = useI18n();
  const agent = useAgent();
  const [filters] = useDashboardFilters();
  const [questions, setQuestions] = useState<string[]>([]);
  const context: GameCoveContext = { page: "explore", metric, selection, filters, locale };
  const contextKey = JSON.stringify(context);

  useEffect(() => {
    let alive = true;
    fetchRecommendedQuestions(JSON.parse(contextKey))
      .then((r) => alive && setQuestions(r.questions))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [contextKey]);

  const chip = (q: string, starter = false) => (
    <button
      key={q}
      type="button"
      onClick={() => agent.ask(q, context)}
      className={`flex h-control-40 items-center gap-2 rounded-full px-4 text-fs-16 leading-[1.5] text-text-primary cursor-pointer hover:bg-bg-hover ${
        starter ? "inset-ring inset-ring-border-default" : ""
      }`}
      style={{ animation: "gc-fade-in 240ms ease-out both" }}
    >
      <SparkIcon className="shrink-0 text-icon-ai" />
      {q}
    </button>
  );

  // 내비에서 바로 들어온 Explore (지표 없음): 기간·필터 없이 시작 질문을 가운데에
  if (!metric) {
    return (
      <div className="flex min-h-[calc(100vh/var(--gc-zoom)-56px)] w-full flex-col p-12">
        <PageHeader title={t.dashboard.pages.explore.title} actions={false} />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-24">
          <p className="text-[20px] leading-[1.3] font-bold text-text-primary">{t.explore.startTitle}</p>
          <div aria-label={t.explore.suggestionsLabel} className="flex max-w-[880px] flex-wrap justify-center gap-3">
            {questions.map((q) => chip(q, true))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-[60px] p-12">
      <div className="flex flex-col gap-3">
        <PageHeader title={t.dashboard.pages.explore.title} actions={false}>
          {/* Figma AI suggestions: 칩 h40 px16 gap8, 칩 사이 8 — 글자가 제목과 맞도록 왼쪽 -16 */}
          <div aria-label={t.explore.suggestionsLabel} className="-ml-4 flex min-h-10 flex-wrap items-center gap-2 pt-1">
            {questions.map((q) => chip(q))}
          </div>
        </PageHeader>
      </div>
      <div className="flex flex-col gap-12">
        <FiltersBar breakdown={false} />
        <FilterScopeProvider scope="explore">
          <MetricCard metric={metric} selection={selection} />
        </FilterScopeProvider>
      </div>
    </div>
  );
}
