// 조회 함수(lib/dashboard/queries.ts) 결과를 Excel의 Summary·Definition 시트와 대조한다.
// 실행: npm run data:check   (raw에서 계산한 값이 요약값과 같은지 — UI 값을 Summary에서 가져오지 않는다)

import { createRequire } from "node:module";
import {
  defaultFilters,
  getAverageSessionTime,
  getDailyActiveUsers,
  getNewReturning,
  getNewUserProgression,
  getOverviewKpis,
  getPlaytime,
  getRetention,
  getSessionFlow,
  getSessions,
  getStageProgression,
} from "../lib/dashboard/queries";
import type { DashboardFilters } from "../data/dashboard/types";

const require = createRequire(import.meta.url);
const X = require("xlsx");
const wb = X.readFile(process.argv[2] ?? "data/source/BounceBounce_DummyData_v6_day8.xlsx");
const sheet = (n: string) => X.utils.sheet_to_json(wb.Sheets[n], { raw: false, defval: null }) as Record<string, string>[];
const pct = (s: string) => Number(s.replace("%", ""));

let pass = 0;
let fail = 0;
function check(label: string, actual: number | null, expected: number, tol = 0.05) {
  const ok = actual !== null && Math.abs(actual - expected) <= tol;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: ${actual === null ? "null" : Math.round(actual * 1000) / 1000} (expected ${expected})`);
}

const f = defaultFilters;
// Daily_Summary: Day 1~7 = 대시보드 기간(Last 7 days), 마지막 행 Day 8 = Today (아래에서 따로 대조)
const allDaily = sheet("Daily_Summary");
const daily = allDaily.slice(0, 7);
const dau = getDailyActiveUsers(f).series[0].values;
const nr = getNewReturning(f).values;
const sessions = getSessions(f, "total").series[0].values;
const playtimeHours = getPlaytime(f, "total").series[0].values;
const avgSession = getAverageSessionTime(f).series[0].values;
daily.forEach((d, i) => {
  check(`Daily ${d.date_utc} DAU`, dau[i], Number(d.dau), 0);
  check(`Daily ${d.date_utc} new players`, nr.new[i], Number(d.new_players), 0);
  check(`Daily ${d.date_utc} returning players`, nr.returning[i], Number(d.returning_players), 0);
  check(`Daily ${d.date_utc} sessions`, sessions[i], Number(d.sessions), 0);
  check(`Daily ${d.date_utc} playtime sec`, (playtimeHours[i] ?? 0) * 3600, Number(d.playtime_sec), 0.5);
  check(`Daily ${d.date_utc} avg session min`, avgSession[i], Number(d.avg_session_min), 0.001);
});

// Metric_Definitions
const defs = Object.fromEntries(sheet("Metric_Definitions").map((r) => [r.metric_id, r]));
check("K02 평균 DAU (headline)", getDailyActiveUsers(f).headline, Number(defs.K02.value_period_all), 0.5);
const d1 = getRetention(f, 1);
console.log(`      D1 headline (날짜별 평균) = ${d1.headline?.toFixed(2)}% / 날짜별 = ${d1.series[0].values.map((v) => (v === null ? "—" : v.toFixed(1))).join(", ")}`);
console.log(`      참고: K06 pooled(66/510) = ${(Number(defs.K06.value_period_all) * 100).toFixed(2)}% — 카드는 날짜별 평균을 쓴다`);
// D7: Day 8이 생겨 9/15 cohort의 D7(9/22)만 관측 가능, 나머지 날짜는 null
const d7 = getRetention(f, 7).series[0].values;
check("D7: 9/15만 관측, 나머지 null", d7.filter((v, i) => (i === 0 ? v === null : v !== null)).length, 0, 0);
console.log(`      D7 9/15 cohort = ${d7[0]?.toFixed(1)}% (Day 8 부분 일자)`);

// Stage_Summary (All / device)
const stageRows = sheet("Stage_Summary");
for (const row of stageRows) {
  const stage = Number(row.stage_id);
  const device = row.device.toLowerCase();
  const filt: DashboardFilters = row.device === "All" ? f : { ...f, device: [device as DashboardFilters["device"][number]] };
  const sp = getStageProgression(filt, stage);
  const tag = `Stage ${stage} ${row.device}`;
  check(`${tag} players entered`, sp.steps[0].users, Number(row.players_entered), 0);
  check(`${tag} players completed`, sp.steps[sp.steps.length - 1].users, Number(row.players_completed), 0);
  check(`${tag} player clear rate %`, sp.kpis.clearRate, pct(row.player_clear_rate), 0.06);
  check(`${tag} first-clear players`, sp.kpis.firstClearPlayers, Number(row.players_first_clear_observed), 0);
  check(`${tag} avg failures to first clear`, sp.kpis.avgFailuresToFirstClear, Number(row.avg_failures_to_first_clear), 0.001);
  if (row.device === "All")
    console.log(`      ${tag} Avg. first-clear time = ${((sp.kpis.avgFirstClearTimeSec ?? 0) / 60).toFixed(2)}분`);
}

// Play_Start_Funnel
for (const row of sheet("Play_Start_Funnel")) {
  const filt: DashboardFilters = row.device === "All" ? f : { ...f, device: [row.device.toLowerCase() as DashboardFilters["device"][number]] };
  const nup = getNewUserProgression(filt);
  check(`New user funnel ${row.device} step ${row.step_order} (${row.event_name})`, nup.steps[Number(row.step_order) - 1].users, Number(row.reached_players), 0);
}

// Session flow: 목적지 합계 = Visit sessions
for (const area of ["lobby", "stage_1", "stage_2", "stage_3", "stage_4"] as const) {
  const flow = getSessionFlow(f, area);
  check(`Session flow ${area}: 목적지 합 = visit sessions`, flow.destinations.reduce((a, d) => a + d.sessions, 0), flow.visitSessions, 0);
}

// Overview: Today = Day 8 (Daily_Summary 마지막 행), previous 7 days = Day 1~7 날짜별 값의 평균
const kpi = getOverviewKpis();
const d8 = allDaily[7];
check("Overview Today = 2026-09-22", kpi.date === "2026-09-22" ? 0 : 1, 0, 0);
check("Overview DAU (Day 8)", kpi.dailyActiveUsers.value, Number(d8.dau), 0);
check("Overview new active users (Day 8)", kpi.newActiveUsers.value, Number(d8.new_players), 0);
check("Overview avg playtime min (Day 8)", kpi.averagePlaytime.value, Number(d8.playtime_sec) / Number(d8.dau) / 60, 0.001);
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
check("Overview DAU previous 7 days 평균", kpi.dailyActiveUsers.previous, avg(daily.map((d) => Number(d.dau))), 0.001);
check("Overview new previous 7 days 평균", kpi.newActiveUsers.previous, avg(daily.map((d) => Number(d.new_players))), 0.001);
check("Overview playtime previous 7 days 평균", kpi.averagePlaytime.previous, avg(daily.map((d) => Number(d.playtime_sec) / Number(d.dau) / 60)), 0.001);
check("Overview D1 previous = 9/16~21에 관측된 D1(cohort 9/15~20) 평균", kpi.d1Retention.previous, avg(d1.series[0].values.slice(0, 6) as number[]), 0.001);
console.log(`      Today D1 = ${kpi.d1Retention.value?.toFixed(2)}% (9/21 cohort ${kpi.d1Retention.cohortSize}명) vs ${kpi.d1Retention.previous?.toFixed(2)}%`);
for (const [k, v] of Object.entries(kpi)) if (typeof v === "object" && v && "comparison" in v) console.log(`      ${k}: ${JSON.stringify(v.comparison)}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
