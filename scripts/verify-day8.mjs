// v6(Day 8 추가)가 v5의 Day 1~7을 건드리지 않았는지, Day 8이 기존 패턴(문제 A·B·C)을 뒤집지 않는지 확인한다.
// 실행: node scripts/verify-day8.mjs [v5.xlsx] [v6.xlsx]

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const X = require("xlsx");
const V5 = process.argv[2] ?? "C:/Users/123/Desktop/BounceBounce_DummyData_v5_final.xlsx";
const V6 = process.argv[3] ?? "data/source/BounceBounce_DummyData_v6_day8.xlsx";
const DAY8 = "2026-09-22";

const load = (file) => {
  const wb = X.readFile(file);
  const rows = (n) => X.utils.sheet_to_json(wb.Sheets[n], { raw: false, defval: null });
  return { wb, rows };
};
const v5 = load(V5);
const v6 = load(V6);
let fail = 0;
const out = (ok, msg) => {
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};

// 1) Day 1~7 raw 행 동일 (Players는 Day 8 활동자의 누적 컬럼만 달라질 수 있음)
for (const [sheet, key] of [["Sessions", "session_id"], ["StageRuns", "run_id"], ["Events", "event_id"]]) {
  const a = v5.rows(sheet);
  const b = new Map(v6.rows(sheet).map((r) => [r[key], r]));
  const diff = a.filter((r) => JSON.stringify(r) !== JSON.stringify(b.get(r[key]))).length;
  out(diff === 0, `${sheet}: v5 ${a.length}행이 v6에 그대로 (${diff}행 다름)`);
}
{
  const cumulative = new Set(["sessions_7d", "active_days_7d", "playtime_sec", "payer_by_period_end", "highest_stage_cleared_by_period_end", "furthest_stage_reached_by_period_end"]);
  const b = new Map(v6.rows("Players").map((r) => [r.player_id, r]));
  const day8 = new Set(v6.rows("Sessions").filter((s) => s.session_date_utc === DAY8).map((s) => s.player_id));
  let diff = 0;
  let cumOnly = 0;
  for (const r of v5.rows("Players")) {
    const n = b.get(r.player_id);
    const changed = Object.keys(r).filter((k) => r[k] !== n[k]);
    if (!changed.length) continue;
    if (day8.has(r.player_id) && changed.every((k) => cumulative.has(k))) cumOnly++;
    else diff++;
  }
  out(diff === 0, `Players: Day 8 비활동자 행과 모든 속성 컬럼 그대로 (${cumOnly}명은 Day 8 누적 컬럼만 갱신, 예상 밖 변경 ${diff})`);
}
{
  const a = v5.rows("Daily_Summary");
  const b = v6.rows("Daily_Summary");
  out(a.every((r, i) => JSON.stringify(r) === JSON.stringify(b[i])) && b.length === a.length + 1, "Daily_Summary: Day 1~7 행 그대로 + Day 8 한 행");
}

// 2) Day 8 패턴
const S = v6.rows("Sessions");
const R = v6.rows("StageRuns");
const P = v6.rows("Players");
const pct = (a, b) => (b ? (a / b) * 100 : NaN);
const f1 = (x) => x.toFixed(1);
const clearRate = (runs, device) => {
  const rs = runs.filter((r) => r.stage_id === "4" && (!device || r.device === device));
  const entered = new Set(rs.map((r) => r.player_id));
  const cleared = new Set(rs.filter((r) => r.result === "Completed").map((r) => r.player_id));
  return { rate: pct(cleared.size, entered.size), n: entered.size };
};
const day = (rs, d) => rs.filter((r) => r.entered_at_utc.slice(0, 10) === d);
const r8 = day(R, DAY8);
const all = clearRate(R);
const mob = clearRate(R, "Mobile");
const pc = clearRate(R, "PC");
out(mob.rate < pc.rate, `문제 A (Day 1~8 누적) Stage 4 player clear: All ${f1(all.rate)}% · Mobile ${f1(mob.rate)}% < PC ${f1(pc.rate)}%`);
const s4d8 = clearRate(r8);
const others = [1, 2, 3].map((st) => {
  const rs = r8.filter((r) => r.stage_id === String(st));
  return pct(new Set(rs.filter((r) => r.result === "Completed").map((r) => r.player_id)).size, new Set(rs.map((r) => r.player_id)).size);
});
out(others.every((x) => s4d8.rate < x), `문제 A (Day 8) Stage 4 clear ${f1(s4d8.rate)}%가 Stage 1~3(${others.map(f1).join(" / ")}%)보다 낮음`);

// 문제 B: 신규 첫 세션 퍼널 (Day 8 신규)
{
  const newIds = new Set(P.filter((p) => p.first_seen_date_utc === DAY8).map((p) => p.player_id));
  const first = S.filter((s) => newIds.has(s.player_id) && s.is_first_session === "1");
  const bySes = new Map();
  for (const r of R) (bySes.get(r.session_id) ?? bySes.set(r.session_id, []).get(r.session_id)).push(r);
  const n = first.length;
  const s1 = first.filter((s) => (bySes.get(s.session_id) ?? []).some((r) => r.stage_id === "1")).length;
  const c1 = first.filter((s) => (bySes.get(s.session_id) ?? []).some((r) => r.stage_id === "1" && r.result === "Completed")).length;
  const s2 = first.filter((s) => (bySes.get(s.session_id) ?? []).some((r) => r.stage_id === "2")).length;
  out(s1 >= c1 && c1 >= s2, `문제 B (Day 8 신규 ${n}명 첫 세션) Stage1 진입 ${f1(pct(s1, n))}% → 클리어 ${f1(pct(c1, n))}% → Stage2 진입 ${f1(pct(s2, n))}% (전체 기준 82.1 → 62.2 → 53.4)`);
}
// D1: 9/21 cohort가 Day 8에 돌아온 비율
{
  const cohort = P.filter((p) => p.first_seen_date_utc === "2026-09-21").map((p) => p.player_id);
  const back = new Set(S.filter((s) => s.session_date_utc === DAY8).map((s) => s.player_id));
  const d1 = pct(cohort.filter((id) => back.has(id)).length, cohort.length);
  out(d1 >= 8 && d1 <= 16, `문제 B D1 (9/21 cohort → 9/22) ${f1(d1)}% (기존 Day 1~6 cohort 11.9~13.8%)`);
}
// 문제 C: 9/21 Stage 4 완료자 vs Stage 3 플레이어의 Day 8 재방문
{
  const back = new Set(S.filter((s) => s.session_date_utc === DAY8).map((s) => s.player_id));
  const r21 = day(R, "2026-09-21");
  const s4 = [...new Set(r21.filter((r) => r.stage_id === "4" && r.result === "Completed").map((r) => r.player_id))];
  const s3 = [...new Set(r21.filter((r) => r.stage_id === "3").map((r) => r.player_id))];
  const a = pct(s4.filter((id) => back.has(id)).length, s4.length);
  const b = pct(s3.filter((id) => back.has(id)).length, s3.length);
  out(a < b, `문제 C (9/21 → 9/22 재방문) Stage4 완료자 ${f1(a)}% (${s4.length}명) < Stage3 플레이어 ${f1(b)}% (${s3.length}명) (전체 기준 13.2% vs 25.5%)`);
}
// DAU 흐름
{
  const d = v6.rows("Daily_Summary").map((r) => Number(r.dau));
  out(d[7] <= d[6], `DAU 흐름 ${d.join(" → ")} (감소 추세 유지)`);
}

console.log(fail ? `\n${fail} failed` : "\nall passed");
process.exit(fail ? 1 : 0);
