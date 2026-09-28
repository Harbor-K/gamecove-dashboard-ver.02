"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GroupIcon } from "@/components/icons-mapping";
import type {
  Connector,
  HandleSide,
  MapNode,
  MappingGraph,
  NodeGroup,
  NodeIconKey,
} from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { CanvasNode, STATUS_ROW_H, type NodeRowStatus, type NodeVisualState } from "./canvas-node";
import {
  AddNodeButton,
  CanvasControls,
  ConnectorToolbar,
  EditNodePopover,
  NodeActionsMenu,
  type NodeDraft,
} from "./canvas-overlays";
import {
  GROUP_H,
  NODE_H,
  NODE_W,
  bezierPoint,
  connectorEnds,
  connectorPath,
  contains,
  graphBounds,
  groupOf,
  groupRect,
  groupSlot,
  groupWidth,
  handlePoint,
  insideRect,
  nearestSide,
  nodePosition,
  nodeRect,
  type Point,
  type Rect,
} from "./geometry";
import { persist, readPersisted, usePersistentState } from "@/lib/setup-store";
import { toCssPx } from "@/lib/zoom";
import { useHistory } from "./use-history";

// Figma "Mapping — Step 1 (Add, move, connect)" 캔버스.
// - 노드를 누르면 집기(연파랑 glow + 핸들 4개), 그대로 끌면 이동, 연결선 따라감
// - 다른 노드와 1/3 이상 겹치면 그룹 대상(점선) → 놓으면 그룹. 그룹 밖으로 끌면 그룹 테두리 점선 → 밖에 놓으면 그룹에서 빠짐
// - 핸들 눌러 끌기 → 연파랑 곡선 미리보기 → 다른 노드 핸들에 놓으면 회색 연결선
// - 연결선 클릭 → 끝점 강조 + 툴바(hover만). Delete/Backspace로 삭제
// - 우클릭 → Ungroup / Edit / Delete. 더블클릭 → Edit
// - 스페이스+드래그 = 이동, Ctrl+스크롤 / Ctrl+드래그 = 확대·축소, 스크롤 = 이동
// - 되돌리기: 이동·연결·그룹·삭제·추가 (이름·역할·아이콘 편집 제외)

type Content = Record<string, NodeDraft>;
type Viewport = { x: number; y: number; zoom: number };
type Selection = { kind: "node"; id: string } | { kind: "connector"; id: string } | null;

/** 다른 노드와 노드 면적의 1/3 이상 겹치면 그룹 대상 (디자이너 요청) */
const GROUP_OVERLAP = 1 / 3;

/** 정렬 스냅: 다른 노드와 가장자리·가운데가 화면 기준 6px 안이면 맞춰 붙인다. 가이드선은 그리지 않는다 (디자이너 요청) */
const SNAP_PX = 6;
/** 처음 한 번 노드를 화면 가운데로 모았는지 (셋업 진행 저장소) */
const CENTERED_KEY = "setup:canvas:centered";

/** lock = Shift로 고정한 축. 고정한 축은 스냅하지 않는다. */
function snapToNodes(pos: Point, others: Rect[], threshold: number, lock: "x" | "y" | null = null): Point {
  const xs = (x: number) => [x, x + NODE_W / 2, x + NODE_W];
  const ys = (y: number) => [y, y + NODE_H / 2, y + NODE_H];
  let dx: number | null = null;
  let dy: number | null = null;
  for (const o of others) {
    for (const a of xs(pos.x)) for (const b of xs(o.x)) if (Math.abs(b - a) <= threshold && (dx === null || Math.abs(b - a) < Math.abs(dx))) dx = b - a;
    for (const a of ys(pos.y)) for (const b of ys(o.y)) if (Math.abs(b - a) <= threshold && (dy === null || Math.abs(b - a) < Math.abs(dy))) dy = b - a;
  }
  return { x: pos.x + (lock === "x" ? 0 : (dx ?? 0)), y: pos.y + (lock === "y" ? 0 : (dy ?? 0)) };
}

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

let idSeq = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

// ── 그래프 편집 (모두 새 객체를 돌려준다) ──────────────────────────────────────────────────────────
function removeFromGroups(graph: MappingGraph, nodeId: string): MappingGraph {
  const g = groupOf(graph, nodeId);
  if (!g) return graph;
  const rest = g.nodeIds.filter((id) => id !== nodeId);
  if (rest.length >= 2) {
    return { ...graph, groups: graph.groups.map((x) => (x.id === g.id ? { ...x, nodeIds: rest } : x)) };
  }
  // 한 개만 남으면 그룹을 풀고, 남은 노드는 지금 자리 그대로 둔다
  const nodes = graph.nodes.map((n) => {
    if (!rest.includes(n.id)) return n;
    const p = groupSlot(g, g.nodeIds.indexOf(n.id));
    return { ...n, x: p.x, y: p.y };
  });
  return { ...graph, nodes, groups: graph.groups.filter((x) => x.id !== g.id) };
}

function ungroup(graph: MappingGraph, groupId: string): MappingGraph {
  const g = graph.groups.find((x) => x.id === groupId);
  if (!g) return graph;
  const nodes = graph.nodes.map((n) => {
    const i = g.nodeIds.indexOf(n.id);
    if (i < 0) return n;
    const p = groupSlot(g, i);
    return { ...n, x: p.x, y: p.y };
  });
  return { ...graph, nodes, groups: graph.groups.filter((x) => x.id !== groupId) };
}

function deleteNode(graph: MappingGraph, nodeId: string): MappingGraph {
  const g = removeFromGroups(graph, nodeId);
  return {
    ...g,
    nodes: g.nodes.filter((n) => n.id !== nodeId),
    connectors: g.connectors.filter((c) => c.from.nodeId !== nodeId && c.to.nodeId !== nodeId),
  };
}

function moveNode(graph: MappingGraph, nodeId: string, p: Point): MappingGraph {
  return { ...graph, nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, x: p.x, y: p.y } : n)) };
}

function groupNodes(graph: MappingGraph, draggedId: string, targetId: string): MappingGraph {
  let g = removeFromGroups(graph, draggedId);
  const targetGroup = groupOf(g, targetId);
  if (targetGroup) {
    return {
      ...g,
      groups: g.groups.map((x) => (x.id === targetGroup.id ? { ...x, nodeIds: [...x.nodeIds, draggedId] } : x)),
    };
  }
  const target = g.nodes.find((n) => n.id === targetId)!;
  const number = Math.max(0, ...g.groups.map((x) => x.number)) + 1;
  const group: NodeGroup = { id: newId("group"), number, x: target.x - 16, y: target.y - 52, nodeIds: [targetId, draggedId] };
  g = { ...g, groups: [...g.groups, group] };
  return g;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────────
/** edit = Step 1 (편집), review = Step 2, status = Step 3·매핑 완료 (둘 다 클릭만) */
export type CanvasMode = "edit" | "review" | "status";
export type NodeInfo = { id: string; title: string; role: string; icon: NodeIconKey; x: number };

export function MappingCanvas({
  initialGraph,
  entering,
  mode = "edit",
  onNodeClick,
  activeNodeId = null,
  highlightedIds = [],
  reviewedIds = [],
  statuses,
  statusCounts,
  defaultStatus,
  addMenu,
  actions,
  focus = null,
  rightInset = 0,
  onNodesChange,
}: {
  initialGraph: MappingGraph;
  entering: boolean;
  mode?: CanvasMode;
  onNodeClick?: (nodeId: string) => void;
  /** 드로어에 열린 노드 (선택 테두리) */
  activeNodeId?: string | null;
  /** 함께 선택 표시할 노드 ("Apply this to other nodes?"에서 체크한 노드) */
  highlightedIds?: string[];
  /** 검토 완료 노드 (초록 테두리, Step 2) */
  reviewedIds?: string[];
  /** 노드 아래 상태 줄 (Step 3) */
  statuses?: Record<string, NodeRowStatus>;
  /** status가 tracked인 노드의 이벤트 수 */
  statusCounts?: Record<string, number>;
  /** 새로 추가한 노드처럼 statuses에 없는 노드의 상태 */
  defaultStatus?: NodeRowStatus;
  /** 편집 모드가 아닐 때도 오른쪽 위 Add 버튼을 둔다. addLogging을 주면 메뉴에 Add logging도 */
  addMenu?: { addLogging?: () => void };
  /** Add 버튼 왼쪽 (Tracked의 Pending·Events 칩) */
  actions?: ReactNode;
  /** 이 노드들이 보이는 영역 가운데 오도록 화면 이동. key가 바뀔 때마다 실행 */
  focus?: { ids: string[]; key: number; margin?: number } | null;
  /** 오른쪽 드로어 폭 — 보이는 영역 계산에서 뺀다 */
  rightInset?: number;
  /** 노드 이름·아이콘 목록을 부모(드로어)에 알려준다 */
  onNodesChange?: (nodes: NodeInfo[]) => void;
}) {
  const { t } = useI18n();
  const history = useHistory<MappingGraph>(initialGraph, "setup:canvas:graph");
  const graph = history.present;
  const editable = mode === "edit";
  const statusExtra = statuses ? STATUS_ROW_H : 0;

  // 이름·역할·아이콘은 되돌리기 대상이 아니라 그래프와 따로 둔다
  const [content, setContent] = usePersistentState<Content>("setup:canvas:content", () =>
    Object.fromEntries(initialGraph.nodes.map((n) => [n.id, { title: n.title, role: n.role, icon: n.icon }])),
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1640, h: 1024 });
  const [vp, setVp] = usePersistentState<Viewport>("setup:canvas:viewport", { x: 0, y: 0, zoom: 1 });
  const [animateVp, setAnimateVp] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [panning, setPanning] = useState(false);

  const [selection, setSelection] = useState<Selection>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [lifted, setLifted] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);  const [outsideGroup, setOutsideGroup] = useState(false);
  const [connecting, setConnecting] = useState<{
    fromId: string;
    side: HandleSide;
    pointer: Point;
    targetId: string | null;
    targetSide: HandleSide | null;
  } | null>(null);
  const [menu, setMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [editing, setEditing] = useState<{ nodeId: string; draft: NodeDraft } | null>(null);
  const [titleEditId, setTitleEditId] = useState<string | null>(null);

  // 최신 값을 이벤트 핸들러에서 읽기 위한 ref
  const vpRef = useRef(vp);
  const graphRef = useRef(graph);
  useEffect(() => {
    vpRef.current = vp;
    graphRef.current = graph;
  });

  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    // 처음 열 때: 노드 전체를 실제 캔버스 크기의 가운데에 (데이터 좌표는 Figma 캔버스 기준이라 화면이 넓으면 왼쪽에 치우친다)
    if (!readPersisted<boolean>(CENTERED_KEY)) {
      const b = graphBounds(graphRef.current);
      if (b) setVp({ zoom: 1, x: (el.clientWidth - rightInset) / 2 - (b.x + b.w / 2), y: el.clientHeight / 2 - (b.y + b.h / 2) });
      persist(CENTERED_KEY, true);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 노드 목록(이름·아이콘)을 부모에 알린다
  useEffect(() => {
    onNodesChange?.(
      graph.nodes.flatMap((n) =>
        content[n.id] ? [{ id: n.id, ...content[n.id], x: nodePosition(graph, n).x }] : [],
      ),
    );
  }, [graph, content, onNodesChange]);

  // 선택한 노드들이 드로어 왼쪽 보이는 영역 가운데 오도록 부드럽게 이동 (다 안 들어가면 축소)
  useEffect(() => {
    if (!focus || !focus.ids.length) return;
    const g = graphRef.current;
    const rects = focus.ids.flatMap((id) => {
      const n = g.nodes.find((x) => x.id === id);
      if (!n) return [];
      const p = nodePosition(g, n);
      return [{ x: p.x, y: p.y, w: NODE_W, h: NODE_H + statusExtra }];
    });
    if (!rects.length) return;
    const x1 = Math.min(...rects.map((r) => r.x));
    const y1 = Math.min(...rects.map((r) => r.y));
    const x2 = Math.max(...rects.map((r) => r.x + r.w));
    const y2 = Math.max(...rects.map((r) => r.y + r.h));
    const visibleW = size.w - rightInset;
    const margin = focus.margin ?? 120;
    const zoom = clampZoom(Math.min(1, (visibleW - margin * 2) / (x2 - x1), (size.h - margin * 2) / (y2 - y1)));
    setAnimateVp(true);
    setVp({ zoom, x: visibleW / 2 - ((x1 + x2) / 2) * zoom, y: size.h / 2 - ((y1 + y2) / 2) * zoom });
    // focus.key가 바뀔 때만 이동한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.key]);

  // ── 좌표 변환 ──
  // 마우스 좌표(화면 px) → 캔버스 CSS px. 화면 전체 배율(--gc-zoom)을 나눠 준다
  const toLocal = (clientX: number, clientY: number): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: toCssPx(clientX - r.left), y: toCssPx(clientY - r.top) };
  };
  const toWorld = (clientX: number, clientY: number): Point => {
    const p = toLocal(clientX, clientY);
    const v = vpRef.current;
    return { x: (p.x - v.x) / v.zoom, y: (p.y - v.y) / v.zoom };
  };
  const toScreen = (p: Point): Point => ({ x: p.x * vp.zoom + vp.x, y: p.y * vp.zoom + vp.y });

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);
  const posOf = useCallback(
    (id: string): Point | null => {
      if (drag && drag.nodeId === id) return { x: drag.x, y: drag.y };
      const n = nodeById.get(id);
      return n ? nodePosition(graph, n) : null;
    },
    [drag, nodeById, graph],
  );

  const closeOverlays = () => {
    setMenu(null);
  };

  // ── 확대/축소/이동 ──
  const zoomAt = useCallback((local: Point, nextZoom: number, animate = false) => {
    setAnimateVp(animate);
    setVp((v) => {
      const z = clampZoom(nextZoom);
      return { zoom: z, x: local.x - ((local.x - v.x) * z) / v.zoom, y: local.y - ((local.y - v.y) * z) / v.zoom };
    });
  }, [setVp]);

  const center = () => ({ x: size.w / 2, y: size.h / 2 });

  const fit = () => {
    const b = graphBounds(graph);
    if (!b) return;
    setAnimateVp(true);
    setVp({ zoom: 1, x: size.w / 2 - (b.x + b.w / 2), y: size.h / 2 - (b.y + b.h / 2) });
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const local = { x: toCssPx(e.clientX - r.left), y: toCssPx(e.clientY - r.top) };
      if (e.ctrlKey || e.metaKey) {
        zoomAt(local, vpRef.current.zoom * Math.exp(-e.deltaY * 0.002));
      } else {
        setAnimateVp(false);
        setVp((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, setVp]);

  // ── 창 전체 드래그 도우미 ──
  const track = (onMove: (e: PointerEvent) => void, onUp: (e: PointerEvent) => void) => {
    const move = (e: PointerEvent) => onMove(e);
    const up = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      onUp(e);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // 빈 캔버스: 스페이스/가운데 버튼 = 이동, Ctrl = 확대·축소 드래그, 그 외 = 선택 해제
  const onCanvasPointerDown = (e: ReactPointerEvent) => {
    if (e.button === 2) return;
    const startClient = { x: e.clientX, y: e.clientY };
    const startVp = vpRef.current;
    if (spaceDown || e.button === 1) {
      e.preventDefault();
      setPanning(true);
      setAnimateVp(false);
      track(
        (m) =>
          setVp({
            ...startVp,
            x: startVp.x + toCssPx(m.clientX - startClient.x),
            y: startVp.y + toCssPx(m.clientY - startClient.y),
          }),
        () => setPanning(false),
      );
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const anchor = toLocal(e.clientX, e.clientY);
      track(
        (m) => {
          const z = clampZoom(startVp.zoom * Math.exp(-(m.clientY - startClient.y) * 0.005));
          setAnimateVp(false);
          setVp({
            zoom: z,
            x: anchor.x - ((anchor.x - startVp.x) * z) / startVp.zoom,
            y: anchor.y - ((anchor.y - startVp.y) * z) / startVp.zoom,
          });
        },
        () => {},
      );
      return;
    }
    setSelection(null);
    setLifted(null);
    closeOverlays();
  };

  // ── 노드: 누르면 선택 + 집기, 그대로 끌면 이동. 다른 노드에 1/3 이상 겹치면 그룹 대상 ──
  const onNodePointerDown = (node: MapNode, e: ReactPointerEvent) => {
    if (e.button !== 0 || spaceDown || e.ctrlKey || e.metaKey) return; // 캔버스 이동·확대로 넘김
    e.stopPropagation();
    closeOverlays();
    // Step 2·3: 편집 없이 클릭만 (끌면 아무 일 없음)
    if (!editable) {
      const start = { x: e.clientX, y: e.clientY };
      track(
        () => {},
        (u) => {
          if (Math.hypot(u.clientX - start.x, u.clientY - start.y) <= 4) onNodeClick?.(node.id);
        },
      );
      return;
    }
    const startClient = { x: e.clientX, y: e.clientY };
    const startWorld = toWorld(e.clientX, e.clientY);
    const g0 = graphRef.current;
    const startPos = nodePosition(g0, node);
    const homeGroup = groupOf(g0, node.id);
    let moved = false;
    let target: string | null = null;
    let lastPos = startPos;

    setSelection({ kind: "node", id: node.id });
    setLifted(node.id);

    track(
      (m) => {
        // 손떨림으로 이동하지 않도록 3px 넘게 움직였을 때부터 끌기
        if (!moved && Math.hypot(m.clientX - startClient.x, m.clientY - startClient.y) <= 3) return;
        moved = true;
        const w = toWorld(m.clientX, m.clientY);
        const g = graphRef.current;
        let dx = w.x - startWorld.x;
        let dy = w.y - startWorld.y;
        // Shift = 가로 또는 세로 한 방향으로만 (더 많이 움직인 쪽)
        const lock = m.shiftKey ? (Math.abs(dx) >= Math.abs(dy) ? "y" : "x") : null;
        if (lock === "y") dy = 0;
        if (lock === "x") dx = 0;
        const raw = { x: startPos.x + dx, y: startPos.y + dy };
        const others = g.nodes.filter((n) => n.id !== node.id).map((n) => nodeRect(nodePosition(g, n)));
        lastPos = snapToNodes(raw, others, SNAP_PX / vpRef.current.zoom, lock);
        setDrag({ nodeId: node.id, ...lastPos });

        const dragged = nodeRect(lastPos);
        if (homeGroup) setOutsideGroup(!insideRect(dragged, groupRect(homeGroup)));
        // 가장 많이 겹친 다른 노드 (같은 그룹 노드 제외), 노드 면적의 1/3 이상이면 그룹 대상
        let best: { id: string; area: number } | null = null;
        for (const n of g.nodes) {
          if (n.id === node.id || (homeGroup && homeGroup.nodeIds.includes(n.id))) continue;
          const area = overlapArea(dragged, nodeRect(nodePosition(g, n)));
          if (area >= GROUP_OVERLAP * NODE_W * NODE_H && (!best || area > best.area)) best = { id: n.id, area };
        }
        target = best?.id ?? null;
        setDropTarget(target);
      },
      () => {
        setDrag(null);
        setDropTarget(null);
        setOutsideGroup(false);
        setLifted(null);
        if (!moved) return;
        const g = graphRef.current;
        let next: MappingGraph;
        if (target) {
          next = groupNodes(g, node.id, target);
        } else if (homeGroup) {
          const stillInside = insideRect(nodeRect(lastPos), groupRect(groupOf(g, node.id) ?? homeGroup));
          if (stillInside) return; // 그룹 안에 놓으면 제자리
          next = moveNode(removeFromGroups(g, node.id), node.id, lastPos);
        } else {
          next = moveNode(g, node.id, lastPos);
        }
        history.commit(next);
      },
    );
  };

  // ── 핸들: 끌어서 연결 ──
  const onHandlePointerDown = (node: MapNode, side: HandleSide, e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const g0 = graphRef.current;
    const from = handlePoint(nodePosition(g0, node), side);
    setConnecting({ fromId: node.id, side, pointer: from, targetId: null, targetSide: null });
    let target: { id: string; side: HandleSide } | null = null;

    track(
      (m) => {
        const w = toWorld(m.clientX, m.clientY);
        const g = graphRef.current;
        const hit = g.nodes.find((n) => {
          if (n.id === node.id) return false;
          const r = nodeRect(nodePosition(g, n));
          return contains({ x: r.x - 16, y: r.y - 16, w: r.w + 32, h: r.h + 32 }, w);
        });
        target = hit ? { id: hit.id, side: nearestSide(nodePosition(g, hit), w) } : null;
        setConnecting({ fromId: node.id, side, pointer: w, targetId: target?.id ?? null, targetSide: target?.side ?? null });
      },
      () => {
        setConnecting(null);
        if (!target) return;
        const g = graphRef.current;
        const exists = g.connectors.some(
          (c) =>
            (c.from.nodeId === node.id && c.to.nodeId === target!.id) ||
            (c.from.nodeId === target!.id && c.to.nodeId === node.id),
        );
        if (exists) return;
        const connector: Connector = {
          id: newId("connector"),
          from: { nodeId: node.id, side },
          to: { nodeId: target.id, side: target.side },
        };
        history.commit({ ...g, connectors: [...g.connectors, connector] });
      },
    );
  };

  // ── 우클릭 / 더블클릭 / 편집 ──
  const onNodeContextMenu = (node: MapNode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelection({ kind: "node", id: node.id });
    const p = toLocal(e.clientX, e.clientY);
    setMenu({ nodeId: node.id, x: p.x, y: p.y });
  };

  const openEditor = (nodeId: string) => {
    setMenu(null);
    setTitleEditId(null);
    setSelection({ kind: "node", id: nodeId });
    setEditing({ nodeId, draft: content[nodeId] });
  };

  const saveEditor = () => {
    if (!editing) return;
    setContent((c) => ({ ...c, [editing.nodeId]: editing.draft }));
    setEditing(null);
  };

  const removeNode = (nodeId: string) => {
    history.commit(deleteNode(graphRef.current, nodeId));
    setSelection(null);
    setEditing(null);
  };

  const addNode = () => {
    const c = center();
    const world = { x: (c.x - vp.x) / vp.zoom - NODE_W / 2, y: (c.y - vp.y) / vp.zoom - NODE_H / 2 };
    const id = newId("node");
    const icon: NodeIconKey = "node";
    setContent((prev) => ({ ...prev, [id]: { title: t.canvas.untitledNode, role: t.canvas.untitledRole, icon } }));
    history.commit({
      ...graph,
      nodes: [...graph.nodes, { id, x: world.x, y: world.y, title: "", role: "", icon }],
    });
    setSelection({ kind: "node", id });
    setTitleEditId(id);
  };

  // ── 키보드 ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.code === "Space") {
        e.preventDefault();
        setSpaceDown(true);
        return;
      }
      if (!editable) return; // Step 2·3: 되돌리기·삭제 없음
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        history.redo();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        const g = graphRef.current;
        if (selection.kind === "node") removeNode(selection.id);
        else history.commit({ ...g, connectors: g.connectors.filter((c) => c.id !== selection.id) });
        setSelection(null);
        return;
      }
      if (e.key === "Escape") {
        setSelection(null);
        setMenu(null);
        setLifted(null);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  // ── 그리기 준비 ──
  const selectedNodeId = selection?.kind === "node" ? selection.id : null;
  const selectedConnectorId = selection?.kind === "connector" ? selection.id : null;
  const groupH = GROUP_H + statusExtra;
  const draggingGroupId = drag ? groupOf(graph, drag.nodeId)?.id : undefined;
  const menuGroupId = menu ? groupOf(graph, menu.nodeId)?.id : undefined;

  const visualState = (id: string): NodeVisualState => {
    if (!editable) {
      if (activeNodeId === id || highlightedIds.includes(id)) return "selected";
      if (reviewedIds.includes(id)) return "reviewed";
      return hoverId === id ? "hover" : "default";
    }
    if (drag?.nodeId === id || lifted === id) return "moving";
    if (dropTarget === id) return "dropTarget";
    if (selectedNodeId === id || editing?.nodeId === id || menu?.nodeId === id) return "selected";
    if (connecting?.targetId === id) return "hover";
    if (hoverId === id && !drag && !connecting) return "hover";
    return "default";
  };

  const showHandles = (id: string) =>
    editable &&
    (
    (lifted === id && !drag) ||
    connecting?.fromId === id ||
    connecting?.targetId === id ||
    (selectedNodeId === id && hoverId === id && !drag && !connecting));

  const nodeContent = (id: string) => (editing?.nodeId === id ? editing.draft : content[id]);

  const connectorShapes = graph.connectors.flatMap((c) => {
    const ends = connectorEnds(c, posOf);
    if (!ends) return [];
    const path = connectorPath(ends.a, ends.aSide, ends.b, ends.bSide);
    return [{ c, ends, path }];
  });

  const preview = (() => {
    if (!connecting) return null;
    const fromPos = posOf(connecting.fromId);
    if (!fromPos) return null;
    const a = handlePoint(fromPos, connecting.side);
    const targetPos = connecting.targetId ? posOf(connecting.targetId) : null;
    const b = targetPos && connecting.targetSide ? handlePoint(targetPos, connecting.targetSide) : connecting.pointer;
    return connectorPath(a, connecting.side, b, targetPos ? connecting.targetSide : null).d;
  })();

  const toolbarPos = (() => {
    const shape = connectorShapes.find((s) => s.c.id === selectedConnectorId);
    if (!shape) return null;
    const { a, b } = shape.ends;
    const samples = Array.from({ length: 21 }, (_, i) => bezierPoint(a, shape.path.c1, shape.path.c2, b, i / 20));
    const bottom = Math.max(...samples.map((p) => p.y));
    const mid = bezierPoint(a, shape.path.c1, shape.path.c2, b, 0.5);
    const s = toScreen({ x: mid.x, y: bottom });
    return { x: s.x, y: s.y + 20 };
  })();

  const editorPos = (() => {
    if (!editing) return null;
    const p = posOf(editing.nodeId);
    if (!p) return null;
    const s = toScreen(p);
    const right = s.x + NODE_W * vp.zoom + 16;
    const x = right + 360 > size.w - 8 ? Math.max(8, s.x - 16 - 360) : right;
    const y = Math.min(Math.max(8, s.y - 84), Math.max(8, size.h - 409 - 8));
    return { x, y };
  })();

  const cursor = panning ? "cursor-grabbing" : spaceDown ? "cursor-grab" : "";
  const worldTransform = `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`;
  const dotSize = 36 * vp.zoom;

  return (
    <div
      ref={canvasRef}
      className={`relative h-full w-full overflow-hidden bg-bg-tracking-canvas select-none ${cursor}`}
      onPointerDown={onCanvasPointerDown}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu(null);
      }}
    >
      {/* 점 격자: Figma 36px 간격 1.5px 점 (토큰 chart/bar/default, 70%) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `radial-gradient(circle at ${0.75 * vp.zoom}px ${0.75 * vp.zoom}px, var(--gc-chart-bar-default) ${0.75 * vp.zoom}px, transparent ${0.75 * vp.zoom + 0.5}px)`,
          backgroundSize: `${dotSize}px ${dotSize}px`,
          backgroundPosition: `${vp.x}px ${vp.y}px`,
          transition: animateVp ? "background-position 250ms ease, background-size 250ms ease" : undefined,
        }}
      />

      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          transform: worldTransform,
          transition: animateVp ? "transform 250ms ease" : undefined,
          animation: entering ? "gc-fade-in 400ms ease-out both" : undefined,
        }}
        onTransitionEnd={() => setAnimateVp(false)}
      >
        {/* 그룹 (맨 아래) */}
        {graph.groups.map((g) => {
          const active = g.id === menuGroupId || g.id === draggingGroupId;
          const dashed = g.id === draggingGroupId && outsideGroup;
          const w = groupWidth(g.nodeIds.length);
          return (
            <div
              key={g.id}
              className={`absolute flex flex-col items-start gap-3 rounded-lg p-4 ${active ? "bg-bg-hover-subtle" : "bg-bg-canvas"}`}
              style={{
                left: g.x,
                top: g.y,
                width: w,
                height: groupH,
                boxShadow: "inset 0 0 8px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={w} height={groupH}>
                <rect
                  x={active ? 0.75 : 0.5}
                  y={active ? 0.75 : 0.5}
                  width={w - (active ? 1.5 : 1)}
                  height={groupH - (active ? 1.5 : 1)}
                  rx={active ? 15.25 : 15.5}
                  fill="none"
                  stroke={active ? "var(--gc-chart-bar-emphasis)" : "var(--gc-border-default)"}
                  strokeWidth={active ? 1.5 : 1}
                  strokeDasharray={dashed ? "6 4" : undefined}
                />
              </svg>
              <div className="flex h-6 items-center gap-2">
                <GroupIcon className={`shrink-0 ${active ? "text-text-accent" : "text-icon-secondary"}`} />
                <span className={`text-label-default ${active ? "text-text-accent" : "text-text-secondary"}`}>
                  {t.canvas.groupName(g.number)}
                </span>
              </div>
            </div>
          );
        })}

        {/* 연결선 */}
        <svg className="absolute top-0 left-0 overflow-visible" width="1" height="1">
          <defs>
            <marker id="gc-arrow" viewBox="-8 -6 10 12" refX="0" refY="0" markerWidth="10" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M -6.5 -4.5 L 0 0 L -6.5 4.5" fill="none" stroke="var(--gc-icon-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="gc-arrow-accent" viewBox="-8 -6 10 12" refX="0" refY="0" markerWidth="10" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M -6.5 -4.5 L 0 0 L -6.5 4.5" fill="none" stroke="var(--gc-border-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>
          {connectorShapes.map(({ c, path }) => (
            <g key={c.id}>
              <path d={path.d} fill="none" stroke="var(--gc-icon-secondary)" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#gc-arrow)" />
              {/* 클릭 영역 */}
              <path
                d={path.d}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                className={editable ? "cursor-pointer" : "pointer-events-none"}
                onPointerDown={(e) => {
                  if (spaceDown || e.button !== 0) return;
                  e.stopPropagation();
                  closeOverlays();
                  setSelection({ kind: "connector", id: c.id });
                }}
              />
            </g>
          ))}
          {preview && (
            <path d={preview} fill="none" stroke="var(--gc-border-accent)" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#gc-arrow-accent)" />
          )}
          {/* 선택한 연결선: 두 끝점만 강조 */}
          {connectorShapes
            .filter((s) => s.c.id === selectedConnectorId)
            .flatMap(({ c, ends }) =>
              [ends.a, ends.b].map((p, i) => (
                <circle key={`${c.id}-${i}`} cx={p.x} cy={p.y} r="6" fill="var(--gc-chart-bar-emphasis)" stroke="var(--gc-border-accent)" strokeWidth="2" />
              )),
            )}
        </svg>

        {/* 노드 (끌고 있는 노드는 맨 위) */}
        {[...graph.nodes]
          .sort((a, b) => Number(a.id === drag?.nodeId) - Number(b.id === drag?.nodeId))
          .flatMap((node, index) => {
            const c = nodeContent(node.id);
            if (!c) return [];
            const home = nodePosition(graph, node);
            const isDragged = drag?.nodeId === node.id;
            const inGroup = !!groupOf(graph, node.id);
            const common = {
              title: c.title,
              role: c.role,
              icon: c.icon,
            };
            const items = [];
            // 그룹 안 노드를 끌면 원래 자리에 흐린 노드가 남는다
            if (isDragged && inGroup) {
              items.push(<CanvasNode key={`${node.id}-ghost`} x={home.x} y={home.y} state="default" ghost {...common} />);
            }
            const p = isDragged ? { x: drag!.x, y: drag!.y } : home;
            items.push(
                <CanvasNode
                  key={node.id}
                  enterDelay={entering ? 120 + index * 70 : undefined}
                  x={p.x}
                  y={p.y}
                  {...common}
                  state={visualState(node.id)}
                  handles={showHandles(node.id)}
                  pressedHandle={connecting?.fromId === node.id ? connecting.side : null}
                  editingTitle={titleEditId === node.id}
                  onTitleCommit={(value) => {
                    setTitleEditId(null);
                    if (value !== null && value.trim()) {
                      setContent((prev) => ({ ...prev, [node.id]: { ...prev[node.id], title: value.trim() } }));
                    }
                  }}
                  onPointerDown={(e) => onNodePointerDown(node, e)}
                  onHandlePointerDown={(side, e) => onHandlePointerDown(node, side, e)}
                  onDoubleClick={editable ? () => openEditor(node.id) : undefined}
                  onContextMenu={editable ? (e) => onNodeContextMenu(node, e) : undefined}
                  status={statuses ? (statuses[node.id] ?? defaultStatus) : undefined}
                  statusCount={statusCounts?.[node.id]}
                  clickable={!editable}
                  onPointerEnter={() => setHoverId(node.id)}
                  onPointerLeave={() => setHoverId((h) => (h === node.id ? null : h))}
                />,
            );
            return items;
          })}

      </div>

      {/* 화면 고정 UI */}
      {(editable || addMenu || actions) && (
        <div
          className="absolute top-6 z-20 flex items-center gap-2 transition-[right] duration-300 ease-out"
          style={{ right: 24 + rightInset }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {actions}
          {(editable || addMenu) && <AddNodeButton onAddNode={addNode} onAddLogging={addMenu?.addLogging} />}
        </div>
      )}
      <CanvasControls
        onZoomIn={() => zoomAt(center(), vp.zoom * 1.2, true)}
        onZoomOut={() => zoomAt(center(), vp.zoom / 1.2, true)}
        onFit={fit}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={editable && history.canUndo}
        canRedo={editable && history.canRedo}
      />
      {toolbarPos && <ConnectorToolbar x={toolbarPos.x} y={toolbarPos.y} />}
      {menu && (
        <NodeActionsMenu
          x={menu.x}
          y={menu.y}
          inGroup={!!menuGroupId}
          onUngroup={() => menuGroupId && history.commit(ungroup(graphRef.current, menuGroupId))}
          onEdit={() => openEditor(menu.nodeId)}
          onDelete={() => removeNode(menu.nodeId)}
          onClose={() => setMenu(null)}
        />
      )}
      {editing && editorPos && (
        <EditNodePopover
          x={editorPos.x}
          y={editorPos.y}
          draft={editing.draft}
          onChange={(draft) => setEditing({ ...editing, draft })}
          onSave={saveEditor}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
