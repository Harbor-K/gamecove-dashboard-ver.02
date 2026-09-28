"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SparkIcon } from "@/components/icons";
import { ArrowUpRightLgIcon } from "@/components/icons-dashboard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { fetchBriefing } from "@/lib/ai/client";
import type { Briefing } from "@/lib/ai/context";
import { overviewKpiTargets } from "@/data/dashboard/dataset";
import { defaultFilters, getOverviewKpis } from "@/lib/dashboard/queries";
import { formatDelta, formatNumber, formatPercent } from "@/lib/dashboard/format";
import { useI18n } from "@/lib/i18n";
import { useExplore } from "./metric-cards";
import { DeltaChip } from "./ui";

/**
 * Figma `Card / AI briefing`: h96 px24 gap16, bg/ai-subtle 5%, 2px chart/bar/emphasis, radius 16.
 * 문장은 AI가 만든다 (getBriefing — 지금은 dataset으로 계산한 mock). 누르면 브리핑의 지표를 Explore에서 연다
 */
export function AiBriefing({ briefings }: { briefings: Partial<Record<string, Briefing>> }) {
  const { t, locale } = useI18n();
  const explore = useExplore();
  // 서버에서 미리 만든 문장 (Overview는 필터 없음 → 전체 데이터 기준). 없을 때만 받아온다
  const [fetched, setFetched] = useState<Briefing | null>(null);
  const briefing = briefings[locale] ?? fetched;

  useEffect(() => {
    if (briefings[locale]) return;
    let alive = true;
    fetchBriefing({ page: "overview", filters: defaultFilters, locale })
      .then((b) => alive && setFetched(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [briefings, locale]);

  return (
    <button
      type="button"
      aria-label={t.dashboard.openBriefing}
      disabled={!briefing}
      onClick={() => briefing && explore(briefing.metric)}
      // 높이 85 (Figma 96에서 디자이너 요청으로 살짝 줄임)
      className="flex h-[85px] w-full items-center gap-4 rounded-lg bg-bg-ai-subtle px-6 text-left inset-ring-2 inset-ring-chart-bar-emphasis cursor-pointer hover:bg-bg-hover disabled:cursor-default"
    >
      <SparkIcon className="size-8 shrink-0 text-icon-ai" />
      <span className="min-w-0 flex-1 text-[20px] leading-[1.3] tracking-[-0.01em] text-text-primary">
        {briefing?.text ?? " "}
      </span>
      <ArrowUpRightLgIcon className="shrink-0 text-icon-primary" />
    </button>
  );
}

/** Figma `Overview / KPI row`: 4칸 gap16. `KPI card` p24 gap16 radius 16. 누르면 해당 데이터 페이지로 가서 그 지표를 가운데에 */
export function KpiRow() {
  const { t, locale, href } = useI18n();
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();
  // Today(데이터 마지막 날) vs previous 7 days(그 전 7일 날짜별 값의 평균). 비교할 값이 없으면 "— No comparison data"
  const kpis = getOverviewKpis();
  const empty = t.dashboard.retention.empty;
  const items = [
    { id: "dailyActiveUsers", value: formatNumber(locale, kpis.dailyActiveUsers.value), delta: kpis.dailyActiveUsers.comparison },
    { id: "newActiveUsers", value: formatNumber(locale, kpis.newActiveUsers.value), delta: kpis.newActiveUsers.comparison },
    {
      id: "averagePlaytime",
      value: kpis.averagePlaytime.value === null ? empty : t.dashboard.format.minutesShort(Math.round(kpis.averagePlaytime.value * 10) / 10),
      delta: kpis.averagePlaytime.comparison,
    },
    { id: "d1Retention", value: kpis.d1Retention.value === null ? empty : formatPercent(t, locale, kpis.d1Retention.value), delta: kpis.d1Retention.comparison },
  ] as const;
  return (
    <div className="flex w-full gap-4">
      {items.map((k) => ({ ...k, target: overviewKpiTargets[k.id] })).map((k) => (
        <div
          key={k.id}
          role="link"
          tabIndex={0}
          onClick={() => router.push(href(`/projects/${projectId}/${k.target.page}?focus=${k.target.metric}`))}
          onKeyDown={(e) => e.key === "Enter" && router.push(href(`/projects/${projectId}/${k.target.page}?focus=${k.target.metric}`))}
          className="flex min-w-0 flex-1 flex-col gap-4 rounded-lg bg-bg-surface p-6 inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover"
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-label-default text-text-primary">{t.dashboard.kpis[k.id]}</span>
              <InfoTooltip text={t.dashboard.info[k.id]} tone="primary" size={16} strokeWidth={1.2} />
            </div>
            <span className="text-[40px] leading-[1.5] font-bold text-text-primary">{k.value}</span>
          </div>
          <div className="flex h-6 items-center gap-2">
            {k.delta ? (
              <>
                <DeltaChip delta={k.delta} label={formatDelta(t, locale, k.delta)} />
                <span className="text-label-default text-text-secondary">{t.dashboard.delta.vsPrevious7Days}</span>
              </>
            ) : (
              <span className="text-label-default text-text-secondary">{t.dashboard.noComparison}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
