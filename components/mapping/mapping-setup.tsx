"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApplyingOverlay, LoggingDrawer, LoggingStep1, LoggingStep2, LoggingStep3 } from "@/components/logging/logging-drawer";
import { LoadingLabel } from "@/components/logging/parts";
import { ScriptModal, type ScriptView } from "@/components/logging/script-modal";
import { CountChip, EventDetailDrawer, EventListPanel, TrackedNodeDrawer } from "@/components/logging/tracked-overlays";
import { Button } from "@/components/ui/button";
import { analysisById, commonProperties, loggingLoadingMs, observationScript, trackingItemById } from "@/data/logging";
import type { AnalysisId, TrackingEventId } from "@/data/types";
import {
  analysesUsing,
  canvasIdOf,
  deriveTracking,
  loggingIdOf,
  nodeLabels,
  observationScriptFor,
  scopeOf,
} from "@/lib/logging-setup";
import { DRAWER_W } from "@/components/setup/drawer";
import { OnboardingPopup, type OnboardingState } from "@/components/setup/onboarding-popup";
import { useProjectShell } from "@/components/shell/project-shell";
import { SETUP_PHASE_KEY, usePersistentState } from "@/lib/setup-store";
import { MODAL_EXIT_MS } from "@/components/ui/modal";
import type { MappingGraph, NodeDetails, NodeMappingStatus, OnboardingMedia, ScriptReview } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { GameConnectedModal } from "./game-connected-modal";
import { GameMappedModal } from "./game-mapped-modal";
import { MappingCanvas, type CanvasMode, type NodeInfo } from "./mapping-canvas";
import { NodeDetailDrawer } from "./node-detail-drawer";
import { ReviewDrawer, type Resolution } from "./review-drawer";

// 노드 등장 애니메이션 (MappingCanvas: 120ms + i×70ms 지연, 420ms) — 다 뜬 뒤 온보딩 팝업
const nodesEnteredMs = (count: number) => 120 + Math.max(0, count - 1) * 70 + 420;
const POPUP_AFTER_NODES_MS = 150;
/** Step 2부터: 노드 애니메이션 없이 팝업만 조금 뒤에 */
const LATER_STEP_POPUP_DELAY_MS = 400;
/** 드로어 닫힐 때 노드 전체를 가운데로: 가장자리 여백 (Fit과 같은 1배율이 되도록 작게) */
const RECENTER_MARGIN = 48;
/** Step 3 진입 시 상태 줄이 하나씩 켜지는 간격 */
const LIGHT_UP_START_MS = 500;
const LIGHT_UP_STEP_MS = 450;

// 매핑(step1~3) → mapped 모달 → logging(Step 1~3) → tracked. idle = "0 tracked" (로깅 없이 나옴)
type Phase = "intro" | "step1" | "step2" | "step3" | "mapped" | "logging" | "idle" | "tracked";
type TrackedSetup = { analyses: AnalysisId[]; ready: TrackingEventId[]; pending: TrackingEventId[] };
type LoadingKind = "save" | "mapping" | "applying";

// UT Task1 매핑 셋업 전체 흐름.
// 매핑 셋업 팝업 → Step 1(편집) → 로딩 5초 → Step 2(노드 설명 검토) → 로딩 5초 → Step 3(스크립트 대조·적용)
// → Apply → 로딩 5초 → "Your game is mapped!" 모달.
export function MappingSetup({
  initialGraph,
  media,
  aiDetails,
  emptyDetails,
  defaultApplyTo,
  scriptReview,
  loadingMs,
}: {
  initialGraph: MappingGraph;
  media: Record<1 | 2 | 3, OnboardingMedia>;
  aiDetails: Record<string, NodeDetails>;
  emptyDetails: NodeDetails;
  defaultApplyTo: Record<string, string[]>;
  scriptReview: Record<string, ScriptReview>;
  loadingMs: { step1to2: number; step2to3: number; resolveCheck: number; apply: number };
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();
  const shell = useProjectShell();
  const [phase, setPhase] = usePersistentState<Phase>(SETUP_PHASE_KEY, "intro");
  const [introClosing, setIntroClosing] = useState(false);
  const [entering, setEntering] = useState(false);
  const [popup, setPopup] = useState<OnboardingState>("expanded");
  const [loadingKind, setLoadingKind] = useState<LoadingKind>("save");
  const [popupKey, setPopupKey] = useState(0);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [focus, setFocus] = useState<{ ids: string[]; key: number; margin?: number } | null>(null);

  // Step 2
  const [details, setDetails] = usePersistentState<Record<string, NodeDetails>>("setup:details", aiDetails);
  const [reviewed, setReviewed] = usePersistentState<string[]>("setup:reviewed", []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NodeDetails | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  /** 노드별로 마지막 Save 때 체크한 "other nodes" */
  const [applyTo, setApplyTo] = usePersistentState<Record<string, string[]>>("setup:applyTo", {});
  const [popupEnterDelay, setPopupEnterDelay] = useState(0);

  // Step 3
  const [statuses, setStatuses] = usePersistentState<Record<string, NodeMappingStatus>>("setup:statuses", {});
  useEffect(() => {
    // 전부 확인 중 = Step 3 진입 연출 중 → 원래 결과. 하나만 = Save 후 확인 중 → 확인 완료
    const values = Object.values(statuses);
    if (!values.includes("checking")) return;
    const allChecking = values.every((v) => v === "checking");
    setStatuses((s) =>
      Object.fromEntries(
        Object.entries(s).map(([id, v]) => [
          id,
          v !== "checking" ? v : allChecking && scriptReview[id] ? "requiresReview" : "ready",
        ]),
      ) as Record<string, NodeMappingStatus>,
    );
    // 처음 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** Step 3에 들어왔을 때의 노드 설명 (Reset 기준) */
  const [step3Details, setStep3Details] = usePersistentState<Record<string, NodeDetails>>("setup:step3Details", {});
  const [mappedOpen, setMappedOpen] = usePersistentState("setup:mappedOpen", false);

  // Logging setup
  const [logStep, setLogStep] = usePersistentState<1 | 2 | 3>("setup:logStep", 1);
  const [analyses, setAnalyses] = usePersistentState<AnalysisId[]>("setup:analyses", []);
  const [prompt, setPrompt] = usePersistentState("setup:prompt", "");
  /** Step 2에서 끈 Ready 이벤트 (기본은 모두 켜짐) */
  const [readyOff, setReadyOff] = usePersistentState<TrackingEventId[]>("setup:readyOff", []);
  /** Step 2에서 Add to pending 한 Requires setup 이벤트 */
  const [pendingIds, setPendingIds] = usePersistentState<TrackingEventId[]>("setup:pendingIds", []);
  const [saving, setSaving] = useState<"next" | "apply" | null>(null);
  const [applyUnlocked, setApplyUnlocked] = useState(false);
  const [scriptView, setScriptView] = useState<ScriptView | null>(null);
  const logBodyRef = useRef<HTMLDivElement>(null);

  // Tracked
  const [tracked, setTracked] = usePersistentState<TrackedSetup | null>("setup:tracked", null);
  const [inactive, setInactive] = usePersistentState<TrackingEventId[]>("setup:inactive", []);
  const [panel, setPanel] = useState<"events" | "pending" | null>(null);
  const [eventId, setEventId] = useState<TrackingEventId | null>(null);
  const [trackedNodeId, setTrackedNodeId] = useState<string | null>(null);

  // 단계 전환 타이머 (화면을 떠나면 모두 정리)
  const [timers] = useState<ReturnType<typeof setTimeout>[]>(() => []);
  const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));
  useEffect(() => () => timers.forEach(clearTimeout), [timers]);

  const popupDelay = nodesEnteredMs(nodes.length || initialGraph.nodes.length) + POPUP_AFTER_NODES_MS;

  // 매핑 셋업 팝업이 떠 있을 때는 Analytics가 펼쳐진 내비 (Figma), Step 1부터 접힘.
  // Step 1~3 동안은 내비·팝업 X가 Leave setup 모달을 띄운다.
  // 로깅 셋업 중에는 Leave 모달(Logging)이 뜨고, Leave = 0 tracked 화면. Tracked·0 tracked에서는 내비가 바로 이동
  useEffect(() => {
    shell.setAnalyticsOpen(phase === "intro");
    const mapping = phase === "step1" || phase === "step2" || phase === "step3";
    shell.setActiveSetup(mapping ? "mapping" : phase === "logging" ? "logging" : null);
    return () => shell.setActiveSetup(null);
  }, [phase, shell]);

  const onNodesChange = useCallback((list: NodeInfo[]) => setNodes(list), []);
  // 켜지는 순서(왼쪽부터)를 위한 노드 x 위치
  const nodeX = Object.fromEntries(nodes.map((n) => [n.id, n.x]));
  const detailsOf = (id: string) => details[id] ?? emptyDetails;
  const nodeInfo = (id: string | null) => nodes.find((n) => n.id === id) ?? null;

  // 새 단계. Step 1: 노드가 차례로 뜨고 → 팝업. Step 2부터: 노드는 그 자리에 바로, 팝업만 조금 뒤에
  const enterStep = (next: Phase, popupAfterMs?: number) => {
    const animateNodes = next === "step1";
    setPhase(next);
    setPopup("expanded");
    setPopupKey((k) => k + 1);
    setPopupEnterDelay(popupAfterMs ?? (animateNodes ? popupDelay : LATER_STEP_POPUP_DELAY_MS));
    if (animateNodes) {
      setEntering(true);
      later(() => setEntering(false), popupDelay + 600);
    }
  };

  const closeDrawer = () => {
    setOpenId(null);
    setDraft(null);
    setChecked([]);
  };

  // 드로어를 닫으면(Save·X) 넓어진 화면 가운데로 노드 전체를 다시 모은다
  const closeDrawerAndRecenter = () => {
    closeDrawer();
    setFocus({ ids: nodes.map((n) => n.id), key: Date.now(), margin: RECENTER_MARGIN });
  };

  const runLoading = (kind: LoadingKind, ms: number, done: () => void) => {
    closeDrawer();
    setLoadingKind(kind);
    setPopup("loading");
    later(done, ms);
  };

  // ── 흐름 ──
  const goToMapping = () => {
    setIntroClosing(true);
    later(() => {
      setIntroClosing(false);
      enterStep("step1");
    }, MODAL_EXIT_MS);
  };

  const step1Next = () => runLoading("save", loadingMs.step1to2, () => enterStep("step2"));

  // Step 3 진입: 모든 노드가 "Checking…"으로 시작해 왼쪽부터 하나씩 불이 켜지듯 초록(확인 안 된 노드만 빨강)
  const step2Next = () =>
    runLoading("mapping", loadingMs.step2to3, () => {
      const order = [...nodes].sort((a, b) => (nodeX[a.id] ?? 0) - (nodeX[b.id] ?? 0));
      setStatuses(Object.fromEntries(order.map((n) => [n.id, "checking"])));
      setStep3Details(details);
      order.forEach((n, i) =>
        later(
          () => setStatuses((s) => ({ ...s, [n.id]: scriptReview[n.id] ? "requiresReview" : "ready" })),
          LIGHT_UP_START_MS + i * LIGHT_UP_STEP_MS,
        ),
      );
      enterStep("step3", LIGHT_UP_START_MS + order.length * LIGHT_UP_STEP_MS + 200);
    });

  const apply = () =>
    runLoading("applying", loadingMs.apply, () => {
      // 대기(pending) 항목은 그대로, 나머지는 Fully mapped
      setStatuses((s) => Object.fromEntries(Object.entries(s).map(([id, v]) => [id, v === "pending" ? v : "fullyMapped"])));
      setPhase("mapped");
      setMappedOpen(true);
    });

  const back = (to: Phase) => {
    closeDrawer();
    setPopup("expanded");
    setPhase(to);
  };

  // ── Step 2: 노드 클릭 → 드로어 + 가운데로 이동, 검토 완료로 센다 ──
  const openStep2 = (id: string) => {
    // 저장한 적이 있으면 직전에 저장한 체크, 없으면 기본 체크 (Stage 1 → Stage 2~4)
    const others = (applyTo[id] ?? defaultApplyTo[id] ?? []).filter((x) => nodes.some((n) => n.id === x));
    setOpenId(id);
    setDraft(detailsOf(id));
    setChecked(others);
    setFocus({ ids: [id, ...others], key: Date.now() });
  };

  const toggleOther = (id: string) => {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    setChecked(next);
    if (openId) setFocus({ ids: [openId, ...next], key: Date.now() });
  };

  // Reset: AI가 처음 채운 상태(Not identified 포함)와 기본 체크로 (Save 전까지 확정 아님)
  const resetStep2 = () => {
    if (!openId) return;
    const others = (defaultApplyTo[openId] ?? []).filter((x) => nodes.some((n) => n.id === x));
    setDraft(aiDetails[openId] ?? emptyDetails);
    setChecked(others);
    setFocus({ ids: [openId, ...others], key: Date.now() });
  };

  const saveStep2 = () => {
    if (!openId || !draft) return;
    // 유저가 채운 Not identified 항목은 이제 채워진 것으로 본다 (다시 열어도 빨간 테두리 없음)
    const saved = Object.fromEntries(
      Object.entries(draft).map(([k, f]) => [k, { ...f, identified: f.identified || f.value.trim().length > 0 }]),
    ) as NodeDetails;
    // 체크한 노드에도 같은 내용 적용 + 검토 완료로 센다
    setDetails((d) => ({ ...d, [openId]: saved, ...Object.fromEntries(checked.map((id) => [id, saved])) }));
    setApplyTo((a) => ({ ...a, [openId]: checked }));
    // Save를 눌러야 검토 완료(초록). X로 닫으면 그대로
    setReviewed((r) => [...new Set([...r, openId, ...checked])]);
    closeDrawerAndRecenter();
  };

  // ── Step 3: 노드 클릭 → 리뷰 드로어. 빨간 노드는 Save 후 3초 확인 → 초록/주황 ──
  const openStep3 = (id: string) => {
    setOpenId(id);
    setFocus({ ids: [id], key: Date.now() });
  };

  const saveStep3 = (saved: NodeDetails, resolution: Resolution, needsCheck: boolean) => {
    if (!openId) return;
    const id = openId;
    setDetails((d) => ({ ...d, [id]: saved }));
    closeDrawerAndRecenter(); // 확인 중(3초)은 노드 상태 줄에서 보인다
    if (!needsCheck) return;
    setStatuses((s) => ({ ...s, [id]: "checking" }));
    later(() => {
      setStatuses((s) => ({ ...s, [id]: resolution?.kind === "pending" ? "pending" : "ready" }));
    }, loadingMs.resolveCheck);
  };

  // ── Logging setup ──
  const derived = deriveTracking(analyses);
  const readyOn = derived.ready.map((i) => i.id).filter((id) => !readyOff.includes(id));
  const pendingOn = derived.requiresSetup.map((i) => i.id).filter((id) => pendingIds.includes(id));
  const analysisLabel = (id: AnalysisId) => t.logging.analysis[id].label;
  const recenter = () => setFocus({ ids: nodes.map((n) => n.id), key: Date.now(), margin: RECENTER_MARGIN });

  const startLogging = () => {
    setMappedOpen(false);
    setLogStep(1);
    // Figma: 캔버스는 그대로 두고 드로어만 덮는다 (Stage 4는 드로어 아래)
    setPhase("logging");
  };

  const toIdle = () => {
    setSaving(null);
    setScriptView(null);
    setPhase("idle");
    recenter();
  };
  // Leave 모달의 Leave (ProjectShell에 넘긴다)
  useEffect(() => {
    // X로 나갈 때: 로깅 = 0 tracked (Add logging으로 이어서), 매핑 = Overview (Tracking으로 돌아오면 이어서)
    const mapping = phase === "step1" || phase === "step2" || phase === "step3";
    shell.setLeaveAction(phase === "logging" ? toIdle : mapping ? () => router.push(href(`/projects/${projectId}/overview`)) : null);
    return () => shell.setLeaveAction(null);
    // toIdle은 setState와 노드 목록만 쓴다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, shell, nodes]);

  const toggleIn = <T,>(list: T[], id: T) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const logNext = () => {
    if (saving) return;
    setSaving("next");
    const next = logStep === 1 ? 2 : 3;
    later(
      () => {
        setSaving(null);
        setApplyUnlocked(false);
        setLogStep(next);
      },
      logStep === 1 ? loggingLoadingMs.step1to2 : loggingLoadingMs.step2to3,
    );
  };

  const logApply = () => {
    if (saving || !applyUnlocked) return;
    setSaving("apply");
    later(() => {
      setSaving(null);
      setTracked({ analyses, ready: readyOn, pending: pendingOn });
      setInactive([]);
      setPhase("tracked");
      recenter();
    }, loggingLoadingMs.apply);
  };

  // 단계가 바뀌면 드로어 본문을 맨 위로
  useEffect(() => {
    logBodyRef.current?.scrollTo({ top: 0 });
  }, [logStep, phase]);

  // Step 3 Apply: 스크롤이 있으면 끝까지 내렸을 때, 없으면 3초 뒤에 누를 수 있다
  const checkScrolledToEnd = () => {
    const el = logBodyRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 4) setApplyUnlocked(true);
  };
  useEffect(() => {
    if (phase !== "logging" || logStep !== 3) return;
    const el = logBodyRef.current;
    if (el && el.scrollHeight > el.clientHeight + 4) return; // 스크롤로 풀린다
    const id = setTimeout(() => setApplyUnlocked(true), loggingLoadingMs.applyUnlock);
    return () => clearTimeout(id);
  }, [phase, logStep]);

  const facts = (id: TrackingEventId) => {
    const scope = scopeOf(id, analyses);
    return {
      scope,
      scopeLabels: nodeLabels(scope),
      properties: trackingItemById[id].properties,
      coverage: analysesUsing(id, analyses).map(analysisLabel),
    };
  };

  const viewObservationScript = () =>
    setScriptView({
      title: observationScript.name,
      code: observationScriptFor(readyOn),
      meta: [{ label: t.logging.script.location, values: [observationScript.location] }],
    });


  // ── Tracked ──
  const trackedScope = (id: TrackingEventId) => (tracked ? scopeOf(id, tracked.analyses) : []);
  const activeTracked = tracked ? tracked.ready.filter((id) => !inactive.includes(id)) : [];
  const eventsAt = (canvasId: string) => {
    const lid = loggingIdOf(canvasId);
    return lid && tracked ? tracked.ready.filter((id) => trackedScope(id).includes(lid)) : [];
  };
  const trackedCounts = Object.fromEntries(
    nodes.map((n) => [n.id, eventsAt(n.id).filter((id) => activeTracked.includes(id)).length]),
  );
  const nodeStatuses =
    phase === "tracked"
      ? Object.fromEntries(nodes.map((n) => [n.id, trackedCounts[n.id] > 0 ? ("tracked" as const) : ("idle" as const)]))
      : {};

  const openEvent = (id: TrackingEventId) => {
    setTrackedNodeId(null);
    setEventId(id);
    setFocus({ ids: trackedScope(id).map(canvasIdOf), key: Date.now() });
  };
  const openTrackedNode = (id: string) => {
    setEventId(null);
    setTrackedNodeId(id);
    setFocus({ ids: [id], key: Date.now() });
  };
  const closeTrackedDrawer = () => {
    setEventId(null);
    setTrackedNodeId(null);
    recenter();
  };

  // ── 화면 ──
  const mode: CanvasMode = phase === "step1" || phase === "intro" ? "edit" : phase === "step2" ? "review" : "status";
  const mappingDrawerOpen = openId !== null && (phase === "step2" || phase === "step3");
  const trackedDrawerOpen = phase === "tracked" && (eventId !== null || trackedNodeId !== null);
  const drawerOpen = mappingDrawerOpen || phase === "logging" || trackedDrawerOpen;
  const logging = phase === "logging" || phase === "idle" || phase === "tracked";
  const total = nodes.length;
  const reviewedCount = reviewed.filter((id) => nodes.some((n) => n.id === id)).length;
  const blocked = Object.values(statuses).some((s) => s === "requiresReview" || s === "checking");
  const openNode = nodeInfo(openId);

  const loadingText =
    loadingKind === "mapping"
      ? { title: t.onboarding.mappingLoadingTitle, caption: t.onboarding.mappingLoadingCaption }
      : loadingKind === "applying"
        ? { title: t.onboarding.applyingTitle, caption: t.onboarding.applyingCaption }
        : undefined;

  const popupProps = (() => {
    if (phase === "step1")
      return {
        step: 1,
        title: t.onboarding.mappingStep1Title,
        description: t.onboarding.mappingStep1Description,
        media: media[1],
        primaryLabel: t.onboarding.saveNext,
        onPrimary: step1Next,
      };
    if (phase === "step2")
      return {
        step: 2,
        title: t.onboarding.mappingStep2Title,
        description: t.onboarding.mappingStep2Description,
        media: media[2],
        showProgress: true,
        progress: { count: t.onboarding.reviewedCount(reviewedCount, total), label: t.onboarding.nodesReviewed },
        showBack: true,
        onBack: () => back("step1"),
        primaryLabel: t.onboarding.saveNext,
        primaryDisabled: reviewedCount < total,
        onPrimary: step2Next,
      };
    if (phase === "step3")
      return {
        step: 3,
        title: t.onboarding.mappingStep3Title,
        description: t.onboarding.mappingStep3Description,
        media: media[3],
        showBack: true,
        onBack: () => back("step2"),
        primaryLabel: t.onboarding.apply,
        primaryDisabled: blocked,
        onPrimary: apply,
      };
    return null;
  })();

  return (
    <div className="relative h-[calc(100vh/var(--gc-zoom)-56px)] w-full overflow-hidden">
      {phase === "intro" ? (
        <div className="h-full w-full bg-bg-tracking-canvas" />
      ) : (
        <MappingCanvas
          initialGraph={initialGraph}
          entering={entering}
          mode={mode}
          onNodeClick={
            phase === "step2" ? openStep2 : phase === "step3" ? openStep3 : phase === "tracked" ? openTrackedNode : undefined
          }
          activeNodeId={mappingDrawerOpen ? openId : phase === "tracked" ? trackedNodeId : null}
          highlightedIds={
            phase === "step2" && mappingDrawerOpen
              ? checked
              : phase === "tracked" && eventId
                ? trackedScope(eventId).map(canvasIdOf)
                : []
          }
          reviewedIds={phase === "step2" ? reviewed : []}
          statuses={phase === "step3" || phase === "mapped" ? statuses : logging ? nodeStatuses : undefined}
          statusCounts={phase === "tracked" ? trackedCounts : undefined}
          defaultStatus={logging ? "idle" : undefined}
          // Add logging: 0 tracked(로깅을 끝내지 않음) = 직전 단계부터 이어서, Tracked(흐름 완료) = 아무 일 없음
          addMenu={
            phase === "idle" ? { addLogging: () => setPhase("logging") } : phase === "tracked" ? { addLogging: () => {} } : undefined
          }
          actions={
            phase === "tracked" && tracked ? (
              <>
                {tracked.pending.length > 0 && (
                  <CountChip
                    tone="pending"
                    label={t.logging.tracked.pending}
                    count={tracked.pending.length}
                    active={panel === "pending"}
                    onClick={() => setPanel(panel === "pending" ? null : "pending")}
                  />
                )}
                <CountChip
                  tone="positive"
                  label={t.logging.tracked.events}
                  count={tracked.ready.length}
                  active={panel === "events"}
                  onClick={() => setPanel(panel === "events" ? null : "events")}
                />
              </>
            ) : undefined
          }
          focus={focus}
          rightInset={drawerOpen ? DRAWER_W : 0}
          onNodesChange={onNodesChange}
        />
      )}

      {popupProps && (
        <div
          key={popupKey}
          className="absolute bottom-6 z-30 transition-[right] duration-300 ease-out"
          style={{
            right: drawerOpen ? DRAWER_W + 24 : 24,
            animation: `gc-rise-in 480ms ${popupEnterDelay}ms cubic-bezier(0.2,0.8,0.2,1) both`,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <OnboardingPopup
            state={popup}
            loadingText={loadingText}
            onMinimise={() => setPopup("minimised")}
            onRestore={() => setPopup("expanded")}
            onClose={shell.requestLeave}
            {...popupProps}
          />
        </div>
      )}

      {phase === "step2" && openNode && draft && (
        <NodeDetailDrawer
          key={openNode.id}
          node={openNode}
          draft={draft}
          onChange={setDraft}
          otherNodes={nodes.filter((n) => n.id !== openNode.id)}
          checkedIds={checked}
          onToggleOther={toggleOther}
          onReset={resetStep2}
          onSave={saveStep2}
          onClose={closeDrawerAndRecenter}
        />
      )}

      {phase === "step3" && openNode && (
        <ReviewDrawer
          key={openNode.id}
          node={openNode}
          details={detailsOf(openNode.id)}
          initialDetails={step3Details[openNode.id] ?? detailsOf(openNode.id)}
          status={statuses[openNode.id] ?? "ready"}
          initialStatus={scriptReview[openNode.id] ? "requiresReview" : "ready"}
          review={scriptReview[openNode.id]}
          onSave={saveStep3}
          onClose={closeDrawerAndRecenter}
        />
      )}

      {phase === "logging" && (
        <LoggingDrawer
          step={logStep}
          onClose={shell.requestLeave}
          bodyRef={logBodyRef}
          onBodyScroll={logStep === 3 ? checkScrolledToEnd : undefined}
          overlay={saving === "apply" ? <ApplyingOverlay /> : undefined}
          footer={
            logStep === 1 ? (
              <>
                <Button
                  variant="secondary"
                  disabled={saving !== null}
                  onClick={() => {
                    setAnalyses([]);
                    setPrompt("");
                  }}
                >
                  {t.logging.reset}
                </Button>
                <Button variant="primary" disabled={analyses.length === 0} onClick={logNext} aria-busy={saving === "next"}>
                  <LoadingLabel loading={saving === "next"}>{t.logging.saveNext}</LoadingLabel>
                </Button>
              </>
            ) : logStep === 2 ? (
              <>
                <Button variant="secondary" disabled={saving !== null} onClick={() => setLogStep(1)}>
                  {t.logging.back}
                </Button>
                <Button
                  variant="primary"
                  disabled={readyOn.length === 0 && pendingOn.length === 0}
                  onClick={logNext}
                  aria-busy={saving === "next"}
                >
                  <LoadingLabel loading={saving === "next"}>{t.logging.saveNext}</LoadingLabel>
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" disabled={saving !== null} onClick={() => setLogStep(2)}>
                  {t.logging.back}
                </Button>
                <Button variant="primary" disabled={!applyUnlocked} onClick={logApply} aria-busy={saving === "apply"}>
                  <LoadingLabel loading={saving === "apply"}>{t.logging.apply}</LoadingLabel>
                </Button>
              </>
            )
          }
        >
          {logStep === 1 && (
            <LoggingStep1
              selected={analyses}
              onToggle={(id) => setAnalyses((a) => toggleIn(a, id))}
              prompt={prompt}
              onPromptChange={setPrompt}
            />
          )}
          {logStep === 2 && (
            <LoggingStep2
              ready={derived.ready}
              requiresSetup={derived.requiresSetup}
              facts={facts}
              readyOn={readyOn}
              onToggleReady={(id) => setReadyOff((o) => toggleIn(o, id))}
              pending={pendingOn}
              onTogglePending={(id) => setPendingIds((p) => toggleIn(p, id))}
            />
          )}
          {logStep === 3 && (
            <LoggingStep3
              analyses={analyses.map((id) => ({ id, scopeLabels: nodeLabels(analysisById[id].targetNodeIds) }))}
              readyEvents={readyOn}
              readyProperties={[...new Set(readyOn.flatMap((id) => trackingItemById[id].properties))]}
              pending={pendingOn.map((id) => ({ id, neededFor: analysesUsing(id, analyses).map(analysisLabel) }))}
              onViewScript={viewObservationScript}
            />
          )}
        </LoggingDrawer>
      )}

      {phase === "tracked" && tracked && panel && (
        <EventListPanel
          key={panel}
          title={panel === "events" ? t.logging.tracked.trackedEvents : t.logging.tracked.pendingEvents}
          items={
            panel === "events"
              ? tracked.ready.map((id) => ({ id, label: t.logging.events[id], tone: inactive.includes(id) ? ("inactive" as const) : ("positive" as const) }))
              : tracked.pending.map((id) => ({ id, label: t.logging.events[id], tone: "pending" as const }))
          }
          selectedId={panel === "events" ? eventId : null}
          // Pending 항목은 눌러도 아무 일 없음 (디자이너 요청)
          onSelect={panel === "events" ? (id) => openEvent(id as TrackingEventId) : undefined}
          onClose={() => setPanel(null)}
        />
      )}

      {phase === "tracked" && tracked && eventId && (
        <EventDetailDrawer
          key={eventId}
          title={t.logging.events[eventId]}
          active={!inactive.includes(eventId)}
          onActiveChange={(on) => setInactive((list) => (on ? list.filter((x) => x !== eventId) : [...list, eventId]))}
          appliedTo={nodeLabels(trackedScope(eventId))}
          // Tracked에서는 실제로 기록되는 속성 전부 (공통 속성 포함)
          properties={[...trackingItemById[eventId].properties, ...commonProperties]}
          analyses={analysesUsing(eventId, tracked.analyses).map(analysisLabel)}
          onClose={closeTrackedDrawer}
        />
      )}

      {phase === "tracked" && trackedNodeId && (
        <TrackedNodeDrawer
          key={trackedNodeId}
          title={nodeInfo(trackedNodeId)?.title ?? ""}
          events={eventsAt(trackedNodeId).map((id) => ({
            id,
            label: t.logging.events[id],
            properties: [...trackingItemById[id].properties, ...commonProperties],
            active: !inactive.includes(id),
          }))}
          onClose={closeTrackedDrawer}
        />
      )}

      <ScriptModal view={scriptView} onClose={() => setScriptView(null)} />
      <GameConnectedModal open={phase === "intro"} closing={introClosing} onGoToMapping={goToMapping}
        onExploreDashboard={() => router.push(href(`/projects/${projectId}/overview`))}
      />
      <GameMappedModal
        open={mappedOpen}
        onNotNow={() => {
          setMappedOpen(false);
          toIdle();
        }}
        onSetUpLogging={startLogging}
      />
    </div>
  );
}
