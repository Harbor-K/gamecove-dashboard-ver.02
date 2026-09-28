import type { AnalysisId, AnalysisOption, LoggingNode, LoggingNodeId, TrackingEventId, TrackingItem } from "./types";

// Logging setup의 단일 기준(single source of truth). 규칙 v3.
// 분석 칩 선택 → 필요한 이벤트 계산 → Ready to track / Requires setup → Pending.
// 화면은 여기 값만 읽는다. 분석·대상 구조·이벤트·속성·스크립트를 화면에 하드코딩하지 않는다.
// 규칙: 어떤 분석 칩을 하나만 골라도 Requires setup 항목이 최소 1개 생겨야 한다.
// Node는 매핑 UI의 내부 개념일 뿐 — 로깅 이벤트는 BounceBounce의 실제 구조(Lobby + Stage) 기준.
// Stage마다 이벤트를 따로 만들지 않고 stage_id 값으로 구분한다 (stage_entered, stage_id = 1…).
// stage_id는 매핑이 찾아 둔 게임 코드의 Stage 식별 값을 GameCove가 정규화한 속성이다.

/** 매핑 구조. 범위 줄은 targetNodeIds → label로 보여준다 */
export const mappingNodes: LoggingNode[] = [
  { id: "lobby", canvasId: "lobby", label: "Lobby", type: "lobby" },
  { id: "stage_1", canvasId: "stage-1", label: "Stage 1", type: "stage" },
  { id: "stage_2", canvasId: "stage-2", label: "Stage 2", type: "stage" },
  { id: "stage_3", canvasId: "stage-3", label: "Stage 3", type: "stage" },
  { id: "stage_4", canvasId: "stage-4", label: "Stage 4", type: "stage" },
];

const lobby: LoggingNodeId[] = ["lobby"];
const stages: LoggingNodeId[] = ["stage_1", "stage_2", "stage_3", "stage_4"];
const allAreas: LoggingNodeId[] = [...lobby, ...stages];

/** 분석 칩 6개 (표시 순서 = 배열 순서). 라벨·설명은 i18n t.logging.analysis[id] */
export const analysisOptions: AnalysisOption[] = [
  {
    id: "gameProgression",
    targetNodeIds: allAreas,
    ready: ["lobby_entered", "stage_entered"],
    requiresSetup: ["stage_completed"],
  },
  {
    id: "sessionExitLocations",
    targetNodeIds: allAreas,
    ready: ["lobby_entered", "stage_entered", "session_ended"],
    requiresSetup: ["stage_exited"],
  },
  { id: "failuresByStage", targetNodeIds: stages, ready: ["stage_entered"], requiresSetup: ["attempt_failed"] },
  {
    id: "timeSpentByLocation",
    targetNodeIds: allAreas,
    ready: ["lobby_entered", "stage_entered", "session_ended"],
    requiresSetup: ["stage_exited"],
  },
  { id: "withinStageProgress", targetNodeIds: stages, ready: ["stage_entered"], requiresSetup: ["star_collected"] },
  {
    id: "sessionFlow",
    targetNodeIds: allAreas,
    ready: ["session_started", "lobby_entered", "stage_entered", "session_ended"],
    requiresSetup: ["stage_exited"],
  },
];

export const analysisById = Object.fromEntries(analysisOptions.map((a) => [a.id, a])) as Record<
  AnalysisId,
  AnalysisOption
>;

/**
 * 추적 항목 (표시 순서 = 배열 순서, 플레이 흐름 순). 화면 라벨은 i18n t.logging.events[id]
 * - ready: Observation — 매핑한 게임 구조로 GameCove가 감지
 * - requires_setup: Instrumentation — 기존 게임 로직에 로깅 코드를 넣어야 함
 * appliesTo: 이벤트가 기록되는 구조. null = 세션 이벤트 (분석 범위를 그대로 따른다)
 */
export const trackingItems: TrackingItem[] = [
  { id: "session_started", status: "ready", properties: [], appliesTo: null },
  { id: "lobby_entered", status: "ready", properties: [], appliesTo: lobby },
  { id: "stage_entered", status: "ready", properties: ["stage_id"], appliesTo: stages },
  { id: "session_ended", status: "ready", properties: [], appliesTo: null },
  { id: "stage_completed", status: "requires_setup", properties: ["stage_id"], appliesTo: stages },
  { id: "stage_exited", status: "requires_setup", properties: ["stage_id", "destination", "exit_type"], appliesTo: stages },
  { id: "attempt_failed", status: "requires_setup", properties: ["stage_id", "fail_cause"], appliesTo: stages },
  { id: "star_collected", status: "requires_setup", properties: ["stage_id", "star_index"], appliesTo: stages },
];

export const trackingItemById = Object.fromEntries(trackingItems.map((i) => [i.id, i])) as Record<
  TrackingEventId,
  TrackingItem
>;

/** 모든 이벤트에 GameCove가 자동으로 붙이는 공통 값 — 로깅 셋업에서는 "추가할 필요 없음" 안내로만 */
export const commonProperties = ["player_id", "session_id", "timestamp"];

/** (A) Step 3 "Script to be added" — 서버 쪽 공용 observation logger */
export const observationScript = {
  name: "GameCoveLogger",
  /** 게임 안 위치 (서비스 > 스크립트 이름) */
  location: "ServerScriptService > GameCoveLogger",
  header: `-- GameCoveLogger
-- Observation events selected during logging setup
local Players = game:GetService("Players")
local GameCove = require(script.Parent.GameCove)`,
};

/** (A) 선택된 Ready(Observation) 이벤트의 블록. 선택되지 않은 이벤트 블록은 넣지 않는다 */
export const observationScriptBlocks: Partial<Record<TrackingEventId, string>> = {
  session_started: `Players.PlayerAdded:Connect(function(player)
    GameCove:Log("session_started", { player = player })
end)`,
  lobby_entered: `GameCove.LobbyEntered:Connect(function(player)
    GameCove:Log("lobby_entered", { player = player })
end)`,
  stage_entered: `GameCove.StageEntered:Connect(function(player, stageId)
    GameCove:Log("stage_entered", { player = player, stage_id = stageId })
end)`,
  session_ended: `Players.PlayerRemoving:Connect(function(player)
    GameCove:Log("session_ended", { player = player })
end)`,
};

/**
 * (B) Pending(Instrumentation) 이벤트별 템플릿 — 각자 기존 게임 로직(완료·이동·실패·별 수집)에 들어간다.
 * GameCoveLogger와 절대 섞지 않는다. (지금 화면에서는 보여주지 않음)
 */
export const instrumentationScriptTemplates: Partial<Record<TrackingEventId, string>> = {
  stage_completed: `GameCove:Log("stage_completed", {
    stage_id = currentStage
})`,
  stage_exited: `GameCove:Log("stage_exited", {
    stage_id = currentStage,
    destination = nextArea,
    exit_type = nextArea and "transition" or "session_end"
})`,
  attempt_failed: `GameCove:Log("attempt_failed", {
    stage_id = currentStage,
    fail_cause = currentObstacle
})`,
  star_collected: `GameCove:Log("star_collected", {
    stage_id = currentStage,
    star_index = starIndex
})`,
};

/** 단계 사이 로딩 (Save & Next 버튼 자리 스피너). Step 3 Apply는 스크롤이 없으면 applyUnlock 후에 가능 */
export const loggingLoadingMs = { step1to2: 4000, step2to3: 2500, apply: 5000, applyUnlock: 3000 };
