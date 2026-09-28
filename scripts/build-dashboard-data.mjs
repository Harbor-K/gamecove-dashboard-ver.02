// BounceBounce_DummyData_v5_final.xlsx → data/dashboard/bounce-bounce.json (정규화 dataset)
// 실행: npm run data  (Excel 경로를 바꾸려면: npm run data -- <경로>)
// raw 4개 시트(Players / Sessions / StageRuns / Events)만 옮긴다. Summary 시트는 검증(npm run data:check)에만 쓴다.
// 날짜·시각은 ISO(UTC)로 통일. 원본 값은 바꾸지 않고, UI용 파생 값(acquisitionSourceUi 등)만 추가한다.

import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const X = require("xlsx");

// 원본(source of truth): 저장소 안 v6 (v5 + Day 8, scripts/extend-day8.mjs로 생성)
const src = process.argv[2] ?? "data/source/BounceBounce_DummyData_v6_day8.xlsx";
const wb = X.readFile(src);
const rows = (name) => X.utils.sheet_to_json(wb.Sheets[name], { raw: false, defval: null });

/** "2026-09-15 01:10:07" → "2026-09-15T01:10:07Z" */
const iso = (s) => (s ? `${s.replace(" ", "T")}Z` : null);
const num = (s) => (s === null || s === "" ? null : Number(s));

/** "Lobby" / "Stage 3 O5" / "Stage 4 Goal" → 장소 id ("lobby" / "stage_3") */
function areaOf(label) {
  if (!label) return null;
  if (label.startsWith("Lobby")) return "lobby";
  const m = /^Stage (\d)/.exec(label);
  return m ? `stage_${m[1]}` : null;
}

/** player_id 기반 안정적인 해시 (FNV-1a). 새로고침·필터와 상관없이 같은 값 */
function stableHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** acquisition_source_synthetic → UI 항목 (원본은 그대로 둔다) */
function acquisitionUi(playerId, source) {
  switch (source) {
    case "Discover":
      return "homeRecommendations";
    case "Search":
      return "search";
    case "Social":
      // YouTube / Instagram 구분 데이터가 없어 prototype용으로 player_id 해시로 약 60 / 40
      return stableHash(playerId) % 100 < 60 ? "youtube" : "instagram";
    default:
      // Direct, Sponsored Ads, Friend Link → Unattributed
      return "unattributed";
  }
}

const deviceOf = (d) => d.toLowerCase(); // Mobile / PC / Tablet / Console → mobile / pc / tablet / console
const visitOf = (v) => (v === "New" ? "new" : "returning");
/** country_filter: US / CA / BR / MX / GB / KR / Other → 소문자 코드, Other는 null */
const countryFilterOf = (c) => (c && c !== "Other" ? c.toLowerCase() : null);

// ── Players ──
const players = rows("Players").map((p) => ({
  id: p.player_id,
  firstSeenDate: p.first_seen_date_utc,
  device: deviceOf(p.device),
  country: p.country,
  countryFilter: countryFilterOf(p.country_filter),
  acquisitionSourceSynthetic: p.acquisition_source_synthetic,
  acquisitionSourceUi: acquisitionUi(p.player_id, p.acquisition_source_synthetic),
  highestStageClearedBeforeCove: num(p.highest_stage_cleared_before_cove),
  furthestStageReachedBeforeCove: num(p.furthest_stage_reached_before_cove),
}));
const playerById = new Map(players.map((p) => [p.id, p]));

// ── Events → 세션별 이동 경로 (Lobby / Stage n 방문 순서, 연속 중복 제거) ──
const events = rows("Events");
const pathBySession = new Map();
const eventsBySession = new Map();
for (const e of events) {
  const list = eventsBySession.get(e.session_id) ?? [];
  list.push(e);
  eventsBySession.set(e.session_id, list);
}
for (const [sid, list] of eventsBySession) {
  list.sort((a, b) => Number(a.seq_in_session) - Number(b.seq_in_session));
  const path = [];
  for (const e of list) {
    const area = e.event_name === "lobby_entered" ? "lobby" : e.event_name === "stage_entered" ? `stage_${e.stage_id}` : null;
    if (area && path[path.length - 1] !== area) path.push(area);
  }
  pathBySession.set(sid, path);
}
const lastEventAt = events.reduce((m, e) => (e.occurred_at_utc > m ? e.occurred_at_utc : m), "");

// ── Sessions ──
const sessions = rows("Sessions").map((s) => ({
  id: s.session_id,
  playerId: s.player_id,
  date: s.session_date_utc,
  startedAt: iso(s.started_at_utc),
  endedAt: iso(s.ended_at_utc),
  durationSec: num(s.duration_sec),
  device: deviceOf(s.device),
  country: s.country,
  countryFilter: playerById.get(s.player_id)?.countryFilter ?? null,
  visitType: visitOf(s.visit_type),
  isFirstSession: s.is_first_session === "1",
  exitArea: areaOf(s.exit_location),
  path: pathBySession.get(s.session_id) ?? [],
}));

// ── StageRuns ──
const resultOf = (r) => (r === "Completed" ? "completed" : r === "Quit game" ? "quit" : "returnLobby");
const stageRuns = rows("StageRuns").map((r) => ({
  id: r.run_id,
  sessionId: r.session_id,
  playerId: r.player_id,
  stage: num(r.stage_id),
  enteredAt: iso(r.entered_at_utc),
  endedAt: iso(r.ended_at_utc),
  durationSec: num(r.run_duration_sec),
  result: resultOf(r.result),
  attempts: num(r.attempts),
  failures: num(r.failures),
  starsCollected: num(r.stars_collected),
  starsRequired: num(r.stars_required),
  isReplay: r.is_replay === "1",
  device: deviceOf(r.device),
  countryFilter: playerById.get(r.player_id)?.countryFilter ?? null,
  visitType: visitOf(r.visit_type),
}));

const allDates = [...new Set(sessions.map((s) => s.date))].sort();
/** Overview "Today" = 데이터 마지막 날 (UT 시점: Day 8 저녁) */
const today = allDates[allDates.length - 1];
/** 대시보드 기간(Last 7 days) = Today 이전의 완료된 7일 (= Today KPI의 previous 7 days) */
const dates = allDates.filter((d) => d < today).slice(-7);

const dataset = {
  meta: {
    source: src.split(/[\/]/).pop(),
    /** 수집 시작일 (이전 날짜의 신규 cohort는 관측 불가) */
    dataStart: allDates[0],
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    today,
    /** 대시보드에 표시하는 데이터 최신 시각 (마지막 이벤트 이후 15분 단위로 올림 — Excel 마지막 이벤트 22:11 → 22:15) */
    dataThrough: iso(ceilQuarter(lastEventAt)),
    lastEventAt: iso(lastEventAt),
    /** 기간(Last 7 days) 날짜 */
    dates,
    /** 수집된 모든 날짜 (기간 + Today) */
    allDates,
  },
  players,
  sessions,
  stageRuns,
};

function ceilQuarter(s) {
  const d = new Date(`${s.replace(" ", "T")}Z`);
  const q = 15 * 60 * 1000;
  const up = new Date(Math.ceil(d.getTime() / q) * q);
  return up.toISOString().slice(0, 19).replace("T", " ");
}

writeFileSync(new URL("../data/dashboard/bounce-bounce.json", import.meta.url), JSON.stringify(dataset));
console.log(
  `bounce-bounce.json: ${players.length} players, ${sessions.length} sessions, ${stageRuns.length} stage runs, ${allDates.length} days (${allDates[0]} ~ ${today}), period ${dates[0]} ~ ${dates[dates.length - 1]}, data through ${dataset.meta.dataThrough}`,
);
