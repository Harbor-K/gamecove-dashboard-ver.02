import type { Connector, HandleSide, MapNode, MappingGraph, NodeGroup } from "@/data/types";

// Figma `Node / Structure` 240×96, `Node / Group` p16 · header 24 · gap12 · nodes gap24
export const NODE_W = 240;
export const NODE_H = 96;
export const GROUP_PAD = 16;
export const GROUP_HEADER = 24;
export const GROUP_HEADER_GAP = 12;
export const GROUP_NODE_GAP = 24;
export const GROUP_H = GROUP_PAD + GROUP_HEADER + GROUP_HEADER_GAP + NODE_H + GROUP_PAD; // 164
/** 연결선 끝은 노드 테두리에서 4px 떨어진다 (Figma: 노드 오른쪽 316 → 선 시작 320) */
export const CONNECTOR_GAP = 4;

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export const groupWidth = (count: number) =>
  GROUP_PAD * 2 + count * NODE_W + Math.max(0, count - 1) * GROUP_NODE_GAP;

export const groupRect = (g: NodeGroup): Rect => ({ x: g.x, y: g.y, w: groupWidth(g.nodeIds.length), h: GROUP_H });

/** 그룹 안 i번째 노드의 자리 */
export const groupSlot = (g: NodeGroup, index: number): Point => ({
  x: g.x + GROUP_PAD + index * (NODE_W + GROUP_NODE_GAP),
  y: g.y + GROUP_PAD + GROUP_HEADER + GROUP_HEADER_GAP,
});

export function groupOf(graph: MappingGraph, nodeId: string) {
  return graph.groups.find((g) => g.nodeIds.includes(nodeId));
}

/** 노드의 실제 위치 (그룹 안이면 그룹이 정한 자리) */
export function nodePosition(graph: MappingGraph, node: MapNode): Point {
  const g = groupOf(graph, node.id);
  return g ? groupSlot(g, g.nodeIds.indexOf(node.id)) : { x: node.x, y: node.y };
}

export const nodeRect = (p: Point): Rect => ({ x: p.x, y: p.y, w: NODE_W, h: NODE_H });

export const contains = (r: Rect, p: Point) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
export const insideRect = (inner: Rect, outer: Rect) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;

/** 핸들 중심 (Figma: 12px 원이 테두리 가운데 걸침) */
export function handlePoint(p: Point, side: HandleSide): Point {
  switch (side) {
    case "top":
      return { x: p.x + NODE_W / 2, y: p.y };
    case "bottom":
      return { x: p.x + NODE_W / 2, y: p.y + NODE_H };
    case "left":
      return { x: p.x, y: p.y + NODE_H / 2 };
    case "right":
      return { x: p.x + NODE_W, y: p.y + NODE_H / 2 };
  }
}

const normal: Record<HandleSide, Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** 연결선 끝점 = 핸들에서 바깥으로 4px */
export function anchorPoint(p: Point, side: HandleSide): Point {
  const h = handlePoint(p, side);
  const n = normal[side];
  return { x: h.x + n.x * CONNECTOR_GAP, y: h.y + n.y * CONNECTOR_GAP };
}

export function nearestSide(p: Point, pointer: Point): HandleSide {
  const sides: HandleSide[] = ["top", "right", "bottom", "left"];
  let best: HandleSide = "left";
  let bestD = Infinity;
  for (const s of sides) {
    const h = handlePoint(p, s);
    const d = (h.x - pointer.x) ** 2 + (h.y - pointer.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

/**
 * AI가 만든 흐름 연결선(오른쪽→왼쪽)은 노드를 옮기면 방향에 맞춰 면을 다시 고른다.
 * 대상이 오른쪽에 있으면 right→left, 왼쪽이면 left→right, 겹치면 위/아래.
 */
export function autoSides(from: Point, to: Point): [HandleSide, HandleSide] {
  if (to.x >= from.x + NODE_W) return ["right", "left"];
  if (to.x + NODE_W <= from.x) return ["left", "right"];
  return to.y >= from.y ? ["bottom", "top"] : ["top", "bottom"];
}

/**
 * 연결선 곡선. Figma 값: 끝점 사이 거리의 40%, 최대 96px 만큼 면의 바깥 방향으로 당긴 cubic bezier.
 * (예: 64px 직선 → 25.6 / 38.4, 328px → 96 / 232)
 */
export function connectorPath(a: Point, aSide: HandleSide, b: Point, bSide: HandleSide | null) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const k = Math.min(96, dist * 0.4);
  const na = normal[aSide];
  const c1 = { x: a.x + na.x * k, y: a.y + na.y * k };
  const c2 = bSide ? { x: b.x + normal[bSide].x * k, y: b.y + normal[bSide].y * k } : b;
  return { d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`, c1, c2 };
}

export function bezierPoint(a: Point, c1: Point, c2: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

/** 연결선의 두 끝점과 면. 자동 연결선이면 현재 위치로 면을 고른다. posOf = 노드 id → 화면에 그릴 위치 */
export function connectorEnds(c: Connector, posOf: (nodeId: string) => Point | null) {
  const fp = posOf(c.from.nodeId);
  const tp = posOf(c.to.nodeId);
  if (!fp || !tp) return null;
  const [fs, ts] = c.auto ? autoSides(fp, tp) : [c.from.side, c.to.side];
  return { a: anchorPoint(fp, fs), aSide: fs, b: anchorPoint(tp, ts), bSide: ts };
}

/** 노드·그룹 전체를 감싸는 사각형 (Fit 버튼) */
export function graphBounds(graph: MappingGraph): Rect | null {
  const rects: Rect[] = [
    ...graph.nodes.map((n) => nodeRect(nodePosition(graph, n))),
    ...graph.groups.map(groupRect),
  ];
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}
