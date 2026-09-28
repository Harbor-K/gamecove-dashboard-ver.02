// BounceBounce 더미데이터 v5(Day 1~7, 2026-09-15~21)에 Day 8(2026-09-22, UT 당일 저녁까지)을 붙여 v6를 만든다.
// 실행: node scripts/extend-day8.mjs [v5.xlsx 경로]  →  data/source/BounceBounce_DummyData_v6_day8.xlsx
//
// 원칙 (기존 데이터의 의도를 모르므로 새로 만들지 않고 "이어 붙인다"):
// - Day 1~7의 raw 행(Players 제외)은 한 글자도 바꾸지 않는다. Players는 Day 8에 활동한 플레이어의 기간 누적 컬럼만 갱신.
// - 누가 Day 8에 돌아오는지는 Day 1~7에서 실제로 관측된 "전날 → 다음날" 재방문 비율을 그대로 쓴다
//   (가입 경과일 · 전날 접속 · 전날 Stage 4 완료(문제 C) · 신규의 첫날 진행도(문제 B) 기준).
// - Day 8의 행동(세션·Stage run·이벤트)은 같은 진행 상태(누적 클리어 Stage)·같은 기기의 실제 하루 기록을 복제해
//   시간만 Day 8로 옮긴다 → Stage 해금 규칙·기기별 Stage 4 마찰(문제 A)·첫 세션 퍼널(문제 B)이 그대로 이어진다.
// - 신규 플레이어는 최근 신규(9/18~21)의 첫날 기록 전체(속성 포함)를 복제한다.
// - 무작위는 고정 seed라 다시 실행해도 같은 결과.

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const X = require("xlsx");

const SRC = process.argv[2] ?? "C:/Users/123/Desktop/BounceBounce_DummyData_v5_final.xlsx";
const OUT = "data/source/BounceBounce_DummyData_v6_day8.xlsx";
const DAY8 = "2026-09-22";
const DAY_START = "01:00:00";
const CUTOFF = "22:15:00"; // UT 시점: Day 8 저녁 (데이터는 22:15까지)
const COHORT_START = "2026-09-15";
/** Day 8 신규 수: 102→94→87→85→75→67→59 감소 흐름을 잇는다 (하루 약 −6~8) */
const NEW_PLAYERS_DAY8 = 53;
/**
 * Day 8 재방문 수: 130·131·131·136·129·126·125로 거의 유지되는 흐름을 잇는다.
 * Players 시트는 "7일 안에 한 번이라도 접속한 사람"만 담고 있어서 Day 1~7에서 잰 재방문 비율이 실제보다 높다(표본 편향).
 * 그래서 비율 사이의 상대 차이(신규 첫날 진행도·전날 Stage4 완료 등)는 그대로 두고 전체 규모만 이 값에 맞춘다.
 */
const RETURNING_DAY8 = 123;

// ── 난수 (고정 seed) ──
let seed = 20260922;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ── 읽기 ──
const wb = X.readFile(SRC, { cellStyles: true });
const DATE_COLS = new Set(["session_date_utc", "started_at_utc", "ended_at_utc", "entered_at_utc", "occurred_at_utc", "first_seen_date_utc", "date_utc"]);
const serialToStr = (v) => {
  if (typeof v !== "number") return v;
  const iso = new Date(Math.round((v - 25569) * 86400000)).toISOString();
  return iso.slice(11, 19) === "00:00:00" && v % 1 === 0 ? iso.slice(0, 10) : `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
};
const strToSerial = (s) => {
  const [d, t = "00:00:00"] = s.split(" ");
  return Date.parse(`${d}T${t}Z`) / 86400000 + 25569;
};
function readSheet(name) {
  const rows = X.utils.sheet_to_json(wb.Sheets[name], { raw: true, defval: null });
  for (const r of rows) for (const k of Object.keys(r)) if (DATE_COLS.has(k) && r[k] !== null) r[k] = serialToStr(r[k]);
  return rows;
}
const players = readSheet("Players");
const sessions = readSheet("Sessions");
const runs = readSheet("StageRuns");
const events = readSheet("Events");
const daily = readSheet("Daily_Summary");

const dayOf = (s) => s.slice(0, 10);
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const DATES = [...new Set(sessions.map((s) => s.session_date_utc))].sort();
if (DATES.includes(DAY8)) throw new Error("이미 Day 8이 있는 파일입니다");

// ── 인덱스 ──
const playerById = new Map(players.map((p) => [p.player_id, p]));
const sessionsByPlayerDay = new Map();
for (const s of sessions) {
  const k = `${s.player_id}|${s.session_date_utc}`;
  (sessionsByPlayerDay.get(k) ?? sessionsByPlayerDay.set(k, []).get(k)).push(s);
}
for (const list of sessionsByPlayerDay.values()) list.sort((a, b) => a.started_at_utc.localeCompare(b.started_at_utc));
const runsBySession = new Map();
for (const r of runs) (runsBySession.get(r.session_id) ?? runsBySession.set(r.session_id, []).get(r.session_id)).push(r);
const eventsBySession = new Map();
for (const e of events) (eventsBySession.get(e.session_id) ?? eventsBySession.set(e.session_id, []).get(e.session_id)).push(e);
const runsByPlayer = new Map();
for (const r of runs) (runsByPlayer.get(r.player_id) ?? runsByPlayer.set(r.player_id, []).get(r.player_id)).push(r);

const active = (pid, d) => sessionsByPlayerDay.has(`${pid}|${d}`);
/** d 날짜가 시작될 때의 누적 클리어 Stage */
const clearedAtStart = (pid, d) => {
  let c = Number(playerById.get(pid).highest_stage_cleared_before_cove) || 0;
  for (const r of runsByPlayer.get(pid) ?? []) if (r.result === "Completed" && dayOf(r.entered_at_utc) < d) c = Math.max(c, Number(r.stage_id));
  return c;
};
const completedStage4On = (pid, d) => (runsByPlayer.get(pid) ?? []).some((r) => r.result === "Completed" && Number(r.stage_id) === 4 && dayOf(r.entered_at_utc) === d);
const reachedStage2OnFirstDay = (pid) => {
  const fs = playerById.get(pid).first_seen_date_utc;
  return (runsByPlayer.get(pid) ?? []).some((r) => Number(r.stage_id) >= 2 && dayOf(r.entered_at_utc) === fs);
};

// ── 1) 재방문 확률: Day 1~7에서 관측된 전날→다음날 비율 ──
function featureKeys(p, d) {
  const prev = addDays(d, -1);
  const fs = p.first_seen_date_utc;
  if (fs === prev) return [`new|${reachedStage2OnFirstDay(p.player_id) ? "hi" : "lo"}`, "new"];
  const age = fs < COHORT_START ? "pre" : String(Math.min(daysBetween(fs, d), 6));
  const y = active(p.player_id, prev) ? 1 : 0;
  const c = completedStage4On(p.player_id, prev) ? 1 : 0;
  return [`a${age}|y${y}|c${c}`, `a${age}|y${y}`, `y${y}|c${c}`, `y${y}`];
}
const stats = new Map();
for (const d of DATES.slice(1)) {
  for (const p of players) {
    if (p.first_seen_date_utc >= d) continue;
    const hit = active(p.player_id, d) ? 1 : 0;
    for (const k of featureKeys(p, d)) {
      const s = stats.get(k) ?? { n: 0, k: 0 };
      s.n += 1;
      s.k += hit;
      stats.set(k, s);
    }
  }
}
const MIN_N = 25;
const returnProb = (p) => {
  for (const k of featureKeys(p, DAY8)) {
    const s = stats.get(k);
    if (s && s.n >= MIN_N) return { p: s.k / s.n, key: k };
  }
  return { p: 0, key: "none" };
};

const probs = players.map((p) => ({ player: p, ...returnProb(p) }));
const expected = probs.reduce((a, x) => a + x.p, 0);
const scale = RETURNING_DAY8 / expected;
const returning = probs.filter((x) => rand() < Math.min(0.95, x.p * scale)).map((x) => x.player);

// ── 2) 템플릿 (실제 하루 기록) ──
const returningTemplates = []; // Day 2~7 재방문 플레이어-하루
for (const d of DATES.slice(1)) {
  for (const p of players) {
    if (p.first_seen_date_utc >= d || !active(p.player_id, d)) continue;
    returningTemplates.push({ pid: p.player_id, d, cleared: clearedAtStart(p.player_id, d), device: p.device });
  }
}
const newTemplates = players.filter((p) => p.first_seen_date_utc >= "2026-09-18" && p.first_seen_date_utc <= "2026-09-21");
const usage = new Map();
const leastUsed = (cands) => {
  const min = Math.min(...cands.map((c) => usage.get(`${c.pid}|${c.d}`) ?? 0));
  return pick(cands.filter((c) => (usage.get(`${c.pid}|${c.d}`) ?? 0) === min));
};

// ── 3) 복제 ──
let nextSession = Math.max(...sessions.map((s) => Number(s.session_id.slice(1)))) + 1;
let nextRun = Math.max(...runs.map((r) => Number(r.run_id.slice(1)))) + 1;
let nextEvent = Math.max(...events.map((e) => Number(e.event_id.slice(1)))) + 1;
let nextPlayer = Math.max(...players.map((p) => Number(p.player_id.slice(1)))) + 1;
const id = (prefix, n, width) => `${prefix}${String(n).padStart(width, "0")}`;

const toSec = (t) => {
  const [h, m, s] = t.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};
const fromSec = (x) => [Math.floor(x / 3600), Math.floor((x % 3600) / 60), x % 60].map((v) => String(v).padStart(2, "0")).join(":");
const shiftTo8 = (ts, offset) => `${DAY8} ${fromSec(toSec(ts.slice(11)) + offset)}`;

const newSessions = [];
const newRuns = [];
const newEvents = [];
const newPlayers = [];
const templateLog = [];

/** 템플릿 플레이어-하루를 target 플레이어의 Day 8로 복제. 저녁 컷오프를 넘는 세션은 버린다 */
function clonePlayerDay(tpl, target, { visitType, payerAtStart }) {
  const src = sessionsByPlayerDay.get(`${tpl.pid}|${tpl.d}`);
  const first = toSec(src[0].started_at_utc.slice(11));
  const last = Math.max(...src.map((s) => toSec(s.ended_at_utc.slice(11))));
  // 같은 하루 기록이 겹쳐 보이지 않게 최대 ±60분 옮긴다 (01:00~22:15 안)
  const lo = Math.max(-3600, toSec(DAY_START) - first);
  const hi = Math.min(3600, toSec(CUTOFF) - last);
  const offset = lo <= hi ? Math.round(lo + rand() * (hi - lo)) : 0;
  const kept = src.filter((s) => toSec(s.ended_at_utc.slice(11)) + offset <= toSec(CUTOFF) && toSec(s.started_at_utc.slice(11)) + offset >= 0);
  if (!kept.length) return false;
  let payer = payerAtStart;
  kept.forEach((s) => {
    const sid = id("S", nextSession++, 5);
    const runMap = new Map();
    newSessions.push({
      ...s,
      session_id: sid,
      player_id: target.player_id,
      session_date_utc: DAY8,
      started_at_utc: shiftTo8(s.started_at_utc, offset),
      ended_at_utc: shiftTo8(s.ended_at_utc, offset),
      device: target.device,
      country: target.country,
      visit_type: visitType,
      payer_at_session_start: payer ? "Payer" : "Non-payer",
      change_note: `v6 Day 8 extension (template ${s.session_id})`,
    });
    if (Number(s.purchase_in_session) > 0) payer = true;
    for (const r of runsBySession.get(s.session_id) ?? []) {
      const rid = id("R", nextRun++, 5);
      runMap.set(r.run_id, rid);
      newRuns.push({
        ...r,
        run_id: rid,
        session_id: sid,
        player_id: target.player_id,
        entered_at_utc: shiftTo8(r.entered_at_utc, offset),
        ended_at_utc: shiftTo8(r.ended_at_utc, offset),
        device: target.device,
        country: target.country,
        visit_type: visitType,
      });
    }
    for (const e of eventsBySession.get(s.session_id) ?? []) {
      newEvents.push({
        ...e,
        event_id: id("E", nextEvent++, 6),
        player_id: target.player_id,
        session_id: sid,
        run_id: e.run_id ? runMap.get(e.run_id) : null,
        occurred_at_utc: shiftTo8(e.occurred_at_utc, offset),
        device: target.device,
        country: target.country,
        visit_type: visitType,
        record_basis: `v6 Day 8 (template ${e.event_id})`,
      });
    }
  });
  usage.set(`${tpl.pid}|${tpl.d}`, (usage.get(`${tpl.pid}|${tpl.d}`) ?? 0) + 1);
  templateLog.push({ target: target.player_id, template: `${tpl.pid}@${tpl.d}`, sessions: kept.length });
  return true;
}

// 재방문
const returningActive = [];
for (const p of returning) {
  const state = clearedAtStart(p.player_id, DAY8);
  let cands = returningTemplates.filter((c) => c.cleared === state && c.device === p.device && c.pid !== p.player_id);
  if (cands.length < 3) cands = returningTemplates.filter((c) => c.cleared === state && c.pid !== p.player_id);
  if (!cands.length) continue;
  for (let tries = 0; tries < 5; tries++) {
    if (clonePlayerDay(leastUsed(cands), p, { visitType: "Returning", payerAtStart: Number(p.payer_by_period_end) === 1 })) {
      returningActive.push(p.player_id);
      break;
    }
  }
}

// 신규
const shuffled = [...newTemplates].sort(() => rand() - 0.5);
for (const tpl of shuffled) {
  if (newPlayers.length >= NEW_PLAYERS_DAY8) break;
  const pid = id("P", nextPlayer, 4);
  const player = {
    ...tpl,
    player_id: pid,
    first_seen_date_utc: DAY8,
    highest_stage_cleared_before_cove: 0,
    furthest_stage_reached_before_cove: 0,
  };
  const ok = clonePlayerDay({ pid: tpl.player_id, d: tpl.first_seen_date_utc, cleared: 0, device: tpl.device }, player, {
    visitType: "New",
    payerAtStart: false,
  });
  if (!ok) continue;
  nextPlayer++;
  newPlayers.push(player);
}

// ── 4) Players 기간 누적 컬럼 갱신 (Day 8에 활동한 플레이어만) ──
const day8BySession = new Map(newSessions.map((s) => [s.session_id, s]));
const day8Runs = new Map();
for (const r of newRuns) (day8Runs.get(r.player_id) ?? day8Runs.set(r.player_id, []).get(r.player_id)).push(r);
function applyDay8(p, base) {
  const ss = newSessions.filter((s) => s.player_id === p.player_id);
  if (!ss.length) return;
  const rs = day8Runs.get(p.player_id) ?? [];
  p.sessions_7d = (base ? Number(p.sessions_7d) : 0) + ss.length;
  p.active_days_7d = (base ? Number(p.active_days_7d) : 0) + 1;
  p.playtime_sec = (base ? Number(p.playtime_sec) : 0) + ss.reduce((a, s) => a + Number(s.duration_sec), 0);
  p.payer_by_period_end = (base && Number(p.payer_by_period_end) === 1) || ss.some((s) => Number(s.purchase_in_session) > 0) ? 1 : 0;
  const cleared = Math.max(0, ...rs.filter((r) => r.result === "Completed").map((r) => Number(r.stage_id)));
  const reached = Math.max(0, ...rs.map((r) => Number(r.stage_id)));
  p.highest_stage_cleared_by_period_end = Math.max(base ? Number(p.highest_stage_cleared_by_period_end) : 0, cleared);
  p.furthest_stage_reached_by_period_end = Math.max(base ? Number(p.furthest_stage_reached_by_period_end) : 0, reached);
}
const updatedPlayers = new Set(returningActive);
for (const p of players) if (updatedPlayers.has(p.player_id)) applyDay8(p, true);
for (const p of newPlayers) applyDay8(p, false);
void day8BySession;

// ── 5) 검증 (전체 = Day 1~8) ──
const allSessions = [...sessions, ...newSessions];
const allRuns = [...runs, ...newRuns];
const allEvents = [...events, ...newEvents];
const allPlayers = [...players, ...newPlayers];
const checks = [];
const check = (category, name, violations, checked, note = "") =>
  checks.push({ category, check: name, violations, checked, result: violations === 0 ? "PASS" : "FAIL", note });
{
  const sById = new Map(allSessions.map((s) => [s.session_id, s]));
  const evBySes = new Map();
  for (const e of allEvents) (evBySes.get(e.session_id) ?? evBySes.set(e.session_id, []).get(e.session_id)).push(e);
  let v = 0;
  for (const e of allEvents) {
    const s = sById.get(e.session_id);
    if (!s || e.occurred_at_utc < s.started_at_utc || e.occurred_at_utc > s.ended_at_utc) v++;
  }
  check("시간", "모든 이벤트가 소속 세션 시작~종료 시각 안에 있음", v, allEvents.length);
  let vOrder = 0;
  let vSeq = 0;
  let vLobby = 0;
  for (const s of allSessions) {
    const es = [...(evBySes.get(s.session_id) ?? [])].sort((a, b) => a.seq_in_session - b.seq_in_session);
    if (es[0]?.event_name !== "session_started" || es.at(-1)?.event_name !== "session_ended") vOrder++;
    if (es.some((e, i) => Number(e.seq_in_session) !== i + 1)) vSeq++;
    if (es[1]?.event_name !== "lobby_entered") vLobby++;
  }
  check("순서", "세션 첫 이벤트=session_started, 마지막=session_ended", vOrder, allSessions.length);
  check("순서", "seq_in_session이 1부터 연속", vSeq, allSessions.length);
  check("Lobby", "모든 세션이 session_started → lobby_entered로 시작", vLobby, allSessions.length);
  const byPlayer = new Map();
  for (const s of allSessions) (byPlayer.get(s.player_id) ?? byPlayer.set(s.player_id, []).get(s.player_id)).push(s);
  let vOverlap = 0;
  for (const list of byPlayer.values()) {
    list.sort((a, b) => a.started_at_utc.localeCompare(b.started_at_utc));
    for (let i = 1; i < list.length; i++) if (list[i].started_at_utc < list[i - 1].ended_at_utc) vOverlap++;
  }
  check("시간", "동일 플레이어 세션 시간 겹침 없음", vOverlap, allSessions.length);
  let vRun = 0;
  for (const r of allRuns) {
    const s = sById.get(r.session_id);
    if (!s || r.entered_at_utc < s.started_at_utc || r.ended_at_utc > s.ended_at_utc) vRun++;
  }
  check("시간", "모든 run이 소속 세션 시간 안에 있음", vRun, allRuns.length);
  // 누적 해금
  const pById = new Map(allPlayers.map((p) => [p.player_id, p]));
  const runsByP = new Map();
  for (const r of allRuns) (runsByP.get(r.player_id) ?? runsByP.set(r.player_id, []).get(r.player_id)).push(r);
  let vUnlock = 0;
  let vReplay = 0;
  let vStage5 = 0;
  for (const [pid, rs] of runsByP) {
    rs.sort((a, b) => a.entered_at_utc.localeCompare(b.entered_at_utc));
    let cleared = Number(pById.get(pid).highest_stage_cleared_before_cove) || 0;
    for (const r of rs) {
      const st = Number(r.stage_id);
      if (st > 4) vStage5++;
      if (st > cleared + 1) vUnlock++;
      if (Number(r.is_replay) === 1 && st > cleared) vReplay++;
      if (r.result === "Completed") cleared = Math.max(cleared, st);
    }
  }
  check("진행", "Stage n 진입 전에 Stage n-1 누적 클리어 상태가 존재", vUnlock, allRuns.length);
  check("진행", "Replay run 전에 해당 Stage 누적 클리어 상태가 존재", vReplay, allRuns.length);
  check("전이", "Stage4 이후 Stage5 진입 없음", vStage5, allRuns.length);
  let vAgg = 0;
  const rBySes = new Map();
  for (const r of allRuns) (rBySes.get(r.session_id) ?? rBySes.set(r.session_id, []).get(r.session_id)).push(r);
  for (const s of allSessions) {
    const rs = rBySes.get(s.session_id) ?? [];
    if (Number(s.stage_entries) !== rs.length || Number(s.stage_completions) !== rs.filter((r) => r.result === "Completed").length) vAgg++;
  }
  check("관계", "Sessions.stage_entries/completions = StageRuns 집계", vAgg, allSessions.length);
  let vFirst = 0;
  for (const p of allPlayers) {
    const list = byPlayer.get(p.player_id) ?? [];
    const firsts = list.filter((s) => Number(s.is_first_session) === 1);
    if (p.first_seen_date_utc >= COHORT_START && (firsts.length !== 1 || firsts[0] !== list[0])) vFirst++;
  }
  check("관계", "Cove 기간 신규는 첫 세션이 정확히 1개이고 가장 이른 세션", vFirst, allPlayers.length);
  check("범위", `Day 8 데이터는 ${DAY8} ${DAY_START}~${CUTOFF} 안`, newSessions.filter((s) => s.started_at_utc < `${DAY8} ${DAY_START}` || s.ended_at_utc > `${DAY8} ${CUTOFF}`).length, newSessions.length);
}

// ── 6) 요약 ──
const day8 = {
  date_utc: DAY8,
  dau: new Set(newSessions.map((s) => s.player_id)).size,
  new_players: newPlayers.length,
  returning_players: returningActive.length,
  sessions: newSessions.length,
  playtime_sec: newSessions.reduce((a, s) => a + Number(s.duration_sec), 0),
  avg_session_min: newSessions.reduce((a, s) => a + Number(s.duration_sec), 0) / newSessions.length / 60,
  stage_entries: newRuns.length,
  stage_completions: newRuns.filter((r) => r.result === "Completed").length,
  wau_rolling_7d: new Set(allSessions.filter((s) => s.session_date_utc >= addDays(DAY8, -6)).map((s) => s.player_id)).size,
};

// ── 7) 쓰기 (기존 행은 그대로, 새 행은 같은 열 형식으로 이어 붙임) ──
function appendRows(sheetName, rows) {
  const ws = wb.Sheets[sheetName];
  const range = X.utils.decode_range(ws["!ref"]);
  const headers = [];
  for (let c = range.s.c; c <= range.e.c; c++) headers.push(ws[X.utils.encode_cell({ r: 0, c })]?.v);
  const fmt = headers.map((_, c) => ws[X.utils.encode_cell({ r: 1, c })]?.z);
  let r = range.e.r + 1;
  for (const row of rows) {
    headers.forEach((h, c) => {
      const v = row[h];
      if (v === null || v === undefined || v === "") return;
      const addr = X.utils.encode_cell({ r, c });
      if (DATE_COLS.has(h)) ws[addr] = { t: "n", v: strToSerial(String(v)), z: fmt[c] };
      else if (typeof v === "number" || (typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v) && h !== "stage_id" && typeof ws[X.utils.encode_cell({ r: 1, c })]?.v === "number"))
        ws[addr] = { t: "n", v: Number(v) };
      else ws[addr] = { t: "s", v: String(v) };
    });
    r++;
  }
  range.e.r = r - 1;
  ws["!ref"] = X.utils.encode_range(range);
}
function updatePlayers() {
  const ws = wb.Sheets.Players;
  const range = X.utils.decode_range(ws["!ref"]);
  const headers = [];
  for (let c = range.s.c; c <= range.e.c; c++) headers.push(ws[X.utils.encode_cell({ r: 0, c })]?.v);
  const cols = ["sessions_7d", "active_days_7d", "playtime_sec", "payer_by_period_end", "highest_stage_cleared_by_period_end", "furthest_stage_reached_by_period_end"];
  for (let r = 1; r <= range.e.r; r++) {
    const pid = ws[X.utils.encode_cell({ r, c: 0 })]?.v;
    if (!updatedPlayers.has(pid)) continue;
    const p = playerById.get(pid);
    for (const col of cols) {
      const c = headers.indexOf(col);
      ws[X.utils.encode_cell({ r, c })] = { t: "n", v: Number(p[col]) };
    }
  }
}
updatePlayers();
appendRows("Players", newPlayers);
appendRows("Sessions", newSessions);
appendRows("StageRuns", newRuns);
appendRows("Events", newEvents);
appendRows("Daily_Summary", [day8]);
appendRows(
  "Validation",
  checks.map((c) => ({ ...c, category: `v6 ${c.category}`, check: `${c.check} (Day 1~8)` })),
);
appendRows("Change_Log", [
  {
    change_id: "V6-01",
    target: "전체 기간",
    type: "확장",
    what_changed: `Day 8(${DAY8}, 01:00~${CUTOFF} UTC)을 이어 붙임. Day 1~7 raw 행은 변경 없음. UT 시점 = Day 8 저녁`,
    why: "Overview Today KPI를 'Today(Day 8) vs previous 7 days(Day 1~7)'로 비교하기 위해",
    impact: "Summary 시트(Stage/Zone/Funnel/Metric_Definitions)는 Day 1~7 기준 그대로. Daily_Summary에 Day 8 행 추가",
  },
  {
    change_id: "V6-02",
    target: "Day 8 활동 플레이어",
    type: "생성 규칙",
    what_changed: `재방문 ${returningActive.length}명 = Day 1~7에서 관측된 전날→다음날 재방문 비율(가입 경과일·전날 접속·전날 Stage4 완료·신규 첫날 진행도)로 표본. 신규 ${newPlayers.length}명 = 9/18~21 신규의 첫날 기록 복제`,
    why: "기존 재방문·D1·문제 C 패턴을 새로 만들지 않고 이어가기 위해",
    impact: `관측 비율 그대로면 기대 ${expected.toFixed(1)}명 — 표본 편향(7일 내 접속자만 존재) 때문에 과대 → 비율 간 상대 차이는 유지하고 전체를 ×${scale.toFixed(3)} 해 재방문 추세(125명 안팎)에 맞춤`,
  },
  {
    change_id: "V6-03",
    target: "Day 8 세션·run·이벤트",
    type: "생성 규칙",
    what_changed: "같은 누적 클리어 Stage·같은 기기의 실제 하루 기록(Day 2~7)을 복제해 시간만 Day 8로 이동(±60분, 22:15 이후 세션 제외). change_note / record_basis에 원본 template id 기록",
    why: "Stage 해금·기기별 Stage4 마찰(문제 A)·첫 세션 퍼널(문제 B) 패턴과 모순 없이 이어가기 위해",
    impact: "모든 v6 검증 PASS 필요",
  },
  {
    change_id: "V6-04",
    target: "Players",
    type: "갱신",
    what_changed: "Day 8에 활동한 플레이어의 sessions_7d·active_days_7d·playtime_sec·payer_by_period_end·*_by_period_end를 Day 1~8 누적으로 갱신 (열 이름은 호환 위해 유지). 신규 player_id P0990부터",
    why: "기간 누적 컬럼과 raw 기록의 일치",
    impact: "Day 8에 활동하지 않은 플레이어 행은 변경 없음",
  },
]);
appendRows("README", [
  { 항목: "v6 (Day 8)", 설명: `v5에 Day 8(${DAY8}, 01:00~${CUTOFF} UTC)을 이어 붙인 파일. UT 시점 = Day 8 저녁. Day 1~7(9/15~21) = previous 7 days, Day 8 = Today. 대시보드 기간 필터(Last 7 days)는 Today 이전 완료된 7일(9/15~21).` },
  { 항목: "v6 요약 시트", 설명: "Stage_Summary / Zone_Summary / Play_Start_Funnel / Metric_Definitions는 Day 1~7 기준 그대로. Daily_Summary만 Day 8 행 추가." },
  { 항목: "v6 D7", 설명: "Day 8 데이터로 9/15 cohort의 D7(9/22)이 관측 가능해졌지만 Day 8은 22:15까지의 부분 일자." },
]);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
X.writeFile(wb, OUT, { cellStyles: true, compression: true });

// ── 보고 ──
const failed = checks.filter((c) => c.violations > 0);
console.log(`Day 8: DAU ${day8.dau} (new ${day8.new_players}, returning ${day8.returning_players}), sessions ${day8.sessions}, runs ${newRuns.length}, events ${newEvents.length}`);
console.log(`재방문 기대값 ${expected.toFixed(1)}명 × ${scale.toFixed(3)} → 표본 ${returning.length}명 → 템플릿 매칭 ${returningActive.length}명`);
console.log("Daily_Summary 흐름:", [...daily.map((d) => d.dau), day8.dau].join(" → "));
console.log(checks.map((c) => `${c.result} ${c.check} (${c.violations}/${c.checked})`).join("\n"));
console.log(`→ ${OUT}`);
if (failed.length) process.exit(1);
