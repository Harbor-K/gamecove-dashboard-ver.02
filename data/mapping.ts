import type { MappingGraph, NodeDetails, OnboardingMedia, ScriptReview } from "./types";

// Mapping Step 1 시작 상태 = AI가 게임 스크립트에서 매핑한 구조 (Figma "00 Base · AI-mapped nodes").
// 좌표는 캔버스(1640×1024) 기준 Figma 값 그대로.
export const aiMappedGraph: MappingGraph = {
  nodes: [
    { id: "lobby", x: 76, y: 320, title: "Lobby", role: "Entry point", icon: "door" },
    { id: "stage-1", x: 388, y: 320, title: "Stage 1", role: "Progression", icon: "flag" },
    { id: "stage-2", x: 700, y: 320, title: "Stage 2", role: "Progression", icon: "flag" },
    { id: "stage-3", x: 1012, y: 320, title: "Stage 3", role: "Progression", icon: "flag" },
    { id: "stage-4", x: 1324, y: 320, title: "Stage 4", role: "Progression", icon: "flag" },
  ],
  connectors: [
    { id: "c1", from: { nodeId: "lobby", side: "right" }, to: { nodeId: "stage-1", side: "left" }, auto: true },
    { id: "c2", from: { nodeId: "stage-1", side: "right" }, to: { nodeId: "stage-2", side: "left" }, auto: true },
    { id: "c3", from: { nodeId: "stage-2", side: "right" }, to: { nodeId: "stage-3", side: "left" }, auto: true },
    { id: "c4", from: { nodeId: "stage-3", side: "right" }, to: { nodeId: "stage-4", side: "left" }, auto: true },
  ],
  groups: [],
};

// ── Step 2: AI가 게임 스크립트에서 읽은 노드 설명 (입력창 기본값, 유저가 수정 가능) ─────────────
const stageDetails: NodeDetails = {
  about: { value: "An obstacle course where players collect all stars to clear the stage.", identified: true },
  enter: { value: "Entered from the Lobby when unlocked, or directly after clearing the previous stage.", identified: true },
  ends: { value: "The stage is cleared when all stars are collected. Dying restarts the player from the beginning.", identified: true },
  elements: { value: "Collectible stars and obstacle sections. No checkpoints detected.", identified: true },
};

export const aiNodeDetails: Record<string, NodeDetails> = {
  lobby: {
    about: { value: "A starting area where players spawn and access available stages.", identified: true },
    enter: { value: "Loaded when a player joins the game or returns from a stage.", identified: true },
    ends: { value: "", identified: false },
    elements: { value: "Player spawn and stage entrances.", identified: true },
  },
  // Stage 2~4는 Stage 1과 같은 문구가 기본값
  "stage-1": stageDetails,
  "stage-2": stageDetails,
  "stage-3": stageDetails,
  "stage-4": stageDetails,
};

/** Step 1에서 새로 추가한 노드: AI가 읽은 내용 없음 */
export const emptyNodeDetails: NodeDetails = {
  about: { value: "", identified: false },
  enter: { value: "", identified: false },
  ends: { value: "", identified: false },
  elements: { value: "", identified: false },
};

/**
 * "Apply this to other nodes?" 기본 체크 (처음 열 때만. Save 이후에는 저장한 체크를 기억).
 * Stage 노드 중 하나를 열면 자기 자신과 Lobby를 뺀 나머지 Stage가 기본으로 체크된다.
 */
const stageNodeIds = ["stage-1", "stage-2", "stage-3", "stage-4"];
export const defaultApplyTo: Record<string, string[]> = Object.fromEntries(
  stageNodeIds.map((id) => [id, stageNodeIds.filter((other) => other !== id)]),
);

// ── Step 3: 스크립트와 맞춰 본 결과. 여기 없는 노드는 모든 항목 Identified (Ready to apply) ──
export const scriptReview: Record<string, ScriptReview> = {
  "stage-3": { field: "ends", candidates: ["StarManager", "StageCompleteHandler"] },
};

// 단계 사이 로딩 (AI가 스크립트를 읽고 매핑하는 시간)
export const mappingLoadingMs = {
  step1to2: 5000,
  step2to3: 5000,
  resolveCheck: 3000,
  apply: 5000,
};

// 온보딩 팝업 GIF. src를 넣으면 교체된다 (320×180 슬롯, 2배 해상도 640×360 권장).
// 비어 있으면 "GIF 320 × 180" 자리표시가 보인다.
export const mappingOnboardingMedia: Record<1 | 2 | 3, OnboardingMedia> = {
  1: { src: null },
  2: { src: null },
  3: { src: null },
};
