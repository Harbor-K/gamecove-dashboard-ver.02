import { mappingNodes } from "@/data/logging";
import type { AreaId, FunnelStep, MetricId } from "@/data/dashboard/types";
import { dashboardDefaults } from "@/data/dashboard/dataset";
import {
  AREAS,
  defaultFilters,
  funnelRows,
  getDailyActiveUsers,
  getDateCohorts,
  getExitRate,
  getNewUserProgression,
  getStageProgression,
  type FunnelResult,
} from "@/lib/dashboard/queries";
import { getMessages } from "@/lib/i18n/messages";
import type { Briefing, CovyResponse, GameCoveContext, RecommendedQuestions } from "./context";

// LLM 제공자가 정해지기 전의 더미 응답. 문구는 i18n, 숫자는 모두 dataset에서 계산한다 (지어내지 않는다).

const areaLabel = (id: AreaId) => mappingNodes.find((n) => n.id === id)?.label ?? id;
const fmt = (locale: string | undefined, v: number, d = 1) =>
  new Intl.NumberFormat(locale ?? "en", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);

function stepText(t: ReturnType<typeof getMessages>, step: FunnelStep) {
  const s = t.dashboard.funnel.steps;
  if (step.kind === "lobbyEntered") return s.lobbyEntered;
  if (step.kind === "stageEntered") return s.stageEntered(step.stage);
  if (step.kind === "starEarned") return s.starEarned(step.star);
  return s.stageCleared(step.stage);
}

const filtersOf = (ctx: GameCoveContext) => ctx.filters ?? defaultFilters;
const defaultStage = () => dashboardDefaults.stage;

/** 퍼널의 가장 큰 이탈 단계 */
function maxDrop(result: FunnelResult) {
  const rows = funnelRows(result.steps.map((s) => s.users));
  return { rows, i: rows.findIndex((row) => row.isMaxDrop) };
}

function metricGroup(metric?: MetricId) {
  if (!metric) return "none";
  if (metric === "exitRate" || metric === "sessionFlow") return "flow";
  if (metric === "stageProgression" || metric === "newUserProgression") return "funnel";
  if (metric === "dateCohortRetention" || metric === "progressionRetention" || metric === "d1Retention" || metric === "d7Retention")
    return "retention";
  if (metric === "newAndReturning") return "acquisition";
  return "engagement";
}

export function mockRecommendedQuestions(ctx: GameCoveContext): RecommendedQuestions {
  const t = getMessages(ctx.locale);
  const r = t.aiMock.recommended;
  const group = metricGroup(ctx.metric);
  let questions: string[];
  if (group === "flow") {
    const area = (ctx.selection as AreaId) ?? dashboardDefaults.exitRateArea ?? AREAS[0];
    questions = [r.whichStageLoses, r.whereAfter(areaLabel(area)), r.whatChanged];
  } else if (group === "funnel") {
    const f = filtersOf(ctx);
    const funnel = ctx.metric === "newUserProgression" ? getNewUserProgression(f) : getStageProgression(f, defaultStage());
    const { i } = maxDrop(funnel);
    questions = [r.explainMetric, r.whyDropAt(stepText(t, funnel.steps[Math.max(0, i)].step)), r.splitNewReturning];
  } else if (group === "retention") {
    questions = [r.explainMetric, r.whichCohortBest, r.doesProgressionHelp];
  } else if (group === "acquisition") {
    questions = [r.explainMetric, r.whichSourceBest, r.whatChanged];
  } else if (group === "engagement") {
    questions = [r.explainMetric, r.splitNewReturning, r.whatChanged];
  } else {
    questions = r.default;
  }
  return { questions, source: "mock" };
}

export function mockBriefing(ctx: GameCoveContext): Briefing {
  const t = getMessages(ctx.locale);
  const funnel = getNewUserProgression(filtersOf(ctx));
  const { rows, i: drop } = maxDrop(funnel);
  const i = Math.max(1, drop);
  const lost = funnel.steps[i - 1].users - funnel.steps[i].users;
  const place = (step: FunnelStep) => (step.kind === "lobbyEntered" ? areaLabel("lobby") : step.kind === "stageEntered" ? areaLabel(`stage_${step.stage}` as AreaId) : stepText(t, step));
  return {
    text: t.aiMock.briefing(place(funnel.steps[i - 1].step), place(funnel.steps[i].step), fmt(ctx.locale, lost, 0), fmt(ctx.locale, rows[i].dropOff ?? 0)),
    metric: "newUserProgression",
    source: "mock",
  };
}

/** 모호한 질문(짧고, 보고 있는 지표도 없음)이면 먼저 무엇을 볼지 묻는다 */
export function mockAskCovy(message: string, ctx: GameCoveContext): CovyResponse {
  const t = getMessages(ctx.locale);
  const a = t.aiMock.answer;
  const text = message.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const known = /exit|leave|drop|stage|lobby|retention|return|cohort|session|playtime|star|funnel|progress|new|source|change|metric|player/;
  if (!ctx.metric && words <= 6 && !known.test(text)) {
    return { kind: "clarify", status: t.agent.thinking, question: t.aiMock.clarify.question, options: t.aiMock.clarify.options, source: "mock" };
  }

  const f = filtersOf(ctx);
  const group = /exit|leave|lose|loses/.test(text) ? "flow" : /drop|funnel|star|progress/.test(text) ? "funnel" : /retention|return|cohort/.test(text) ? "retention" : metricGroup(ctx.metric);
  let shows: string;
  let steps: string[];
  if (group === "flow") {
    const sorted = [...getExitRate(f).rows].sort((x, y) => (y.rate ?? -1) - (x.rate ?? -1));
    shows = a.exitRate(areaLabel(sorted[0].area), fmt(ctx.locale, sorted[0].rate ?? 0), areaLabel(sorted[1].area), fmt(ctx.locale, sorted[1].rate ?? 0));
    steps = [a.steps.openFlow, a.steps.compareSegments];
  } else if (group === "funnel") {
    const funnel = ctx.metric === "stageProgression" ? getStageProgression(f, defaultStage()) : getNewUserProgression(f);
    const { rows, i: drop } = maxDrop(funnel);
    const i = Math.max(0, drop);
    shows = a.funnelDrop(stepText(t, funnel.steps[i].step), fmt(ctx.locale, rows[i].dropOff ?? 0), fmt(ctx.locale, rows[i].users, 0));
    steps = [a.steps.compareSegments, a.steps.checkLogging];
  } else if (group === "retention") {
    const best = [...getDateCohorts(f)].sort((x, y) => (y.retention[0] ?? 0) - (x.retention[0] ?? 0))[0];
    const day = new Intl.DateTimeFormat(ctx.locale ?? "en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${best.date}T00:00:00Z`));
    shows = a.retention(day, fmt(ctx.locale, best.retention[0] ?? 0));
    steps = [a.steps.compareSegments, a.steps.checkLogging];
  } else if (group === "engagement" || group === "acquisition" || group === "none") {
    const dau = getDailyActiveUsers({ ...f, breakdown: [] });
    const s = dau.series[0].values;
    shows = a.trend(t.dashboard.kpis.dailyActiveUsers, fmt(ctx.locale, s[0] ?? 0, 0), fmt(ctx.locale, s[s.length - 1] ?? 0, 0), fmt(ctx.locale, dau.headline ?? 0, 0));
    steps = [a.steps.compareSegments, a.steps.checkLogging];
  } else {
    return { kind: "answer", sections: [{ heading: a.dataShows, paragraphs: [a.noData] }], followUps: [], source: "mock" };
  }
  return {
    kind: "answer",
    sections: [
      { heading: a.dataShows, paragraphs: [shows] },
      { heading: a.nextSteps, bullets: steps },
    ],
    followUps: mockRecommendedQuestions(ctx).questions.filter((q) => q.toLowerCase() !== text).slice(0, 3),
    source: "mock",
  };
}
