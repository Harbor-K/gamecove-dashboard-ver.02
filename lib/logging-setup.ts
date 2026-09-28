import {
  analysisById,
  instrumentationScriptTemplates,
  mappingNodes,
  observationScript,
  observationScriptBlocks,
  trackingItemById,
  trackingItems,
} from "@/data/logging";
import type { AnalysisId, LoggingNodeId, TrackingEventId, TrackingItem } from "@/data/types";

// Logging setup 계산 (규칙 v2). 상태로 저장하는 값은 선택한 분석·켠 Ready 이벤트·Pending 이벤트뿐이고
// 나머지(Ready / Requires setup 목록, 범위, 개수, 스크립트)는 전부 여기서 계산한다.

export type DerivedTracking = {
  /** Ready to track (Observation) — 중복 제거, trackingItems 순 */
  ready: TrackingItem[];
  /** Requires setup (Instrumentation) — 중복 제거 */
  requiresSetup: TrackingItem[];
  /** Events N = Ready + Setup 고유 이벤트 수 */
  eventCount: number;
  /** Pending N = 고유 Setup 이벤트 수 */
  pendingCount: number;
};

export function deriveTracking(selectedAnalysisIds: AnalysisId[]): DerivedTracking {
  const readyIds = new Set<TrackingEventId>();
  const setupIds = new Set<TrackingEventId>();
  for (const id of selectedAnalysisIds) {
    analysisById[id].ready.forEach((e) => readyIds.add(e));
    analysisById[id].requiresSetup.forEach((e) => setupIds.add(e));
  }
  const ready = trackingItems.filter((i) => readyIds.has(i.id));
  const requiresSetup = trackingItems.filter((i) => setupIds.has(i.id));
  return {
    ready,
    requiresSetup,
    eventCount: new Set([...readyIds, ...setupIds]).size,
    pendingCount: requiresSetup.length,
  };
}

/** 이 이벤트가 필요한 (선택된) 분석들 */
export function analysesUsing(eventId: TrackingEventId, selectedAnalysisIds: AnalysisId[]): AnalysisId[] {
  return selectedAnalysisIds.filter((id) => {
    const a = analysisById[id];
    return a.ready.includes(eventId) || a.requiresSetup.includes(eventId);
  });
}

/**
 * 이벤트 범위(scope) = 이 이벤트를 쓰는 선택된 분석들의 targetNodeIds 합집합
 * ∩ 이벤트 자체의 appliesTo (있을 때). mappingNodes 순서로 돌려준다.
 */
export function scopeOf(eventId: TrackingEventId, selectedAnalysisIds: AnalysisId[]): LoggingNodeId[] {
  const targets = new Set(analysesUsing(eventId, selectedAnalysisIds).flatMap((id) => analysisById[id].targetNodeIds));
  const own = trackingItemById[eventId].appliesTo;
  return mappingNodes.map((n) => n.id).filter((id) => targets.has(id) && (!own || own.includes(id)));
}

const nodeById = Object.fromEntries(mappingNodes.map((n) => [n.id, n]));

/** 노드 id → 라벨 ("Lobby", "Stage 1"…) */
export const nodeLabels = (ids: LoggingNodeId[]) => ids.map((id) => nodeById[id].label);

/** 캔버스 노드 id ↔ 로깅 노드 id */
export const canvasIdOf = (id: LoggingNodeId) => nodeById[id].canvasId;
export const loggingIdOf = (canvasId: string) => mappingNodes.find((n) => n.canvasId === canvasId)?.id ?? null;

/** (A) Step 3 observation 스크립트: 선택된 Ready 이벤트 블록만 */
export function observationScriptFor(readyEventIds: TrackingEventId[]) {
  const blocks = trackingItems
    .filter((i) => readyEventIds.includes(i.id))
    .flatMap((i) => (observationScriptBlocks[i.id] ? [observationScriptBlocks[i.id]!] : []));
  return [observationScript.header, ...blocks].join("\n\n");
}

/** (B) Pending 이벤트 하나의 instrumentation 템플릿 */
export const instrumentationScriptFor = (eventId: TrackingEventId) => instrumentationScriptTemplates[eventId] ?? "";
