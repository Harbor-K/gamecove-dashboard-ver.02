"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  CheckSmIcon,
  ClockSmIcon,
  DoorIcon,
  FlagIcon,
  NodeIcon,
  PlayersIcon,
  PortalIcon,
  RobloxNodeIcon,
  ShopIcon,
  TrophyIcon,
  WarningSmIcon,
} from "@/components/icons-mapping";
import type { HandleSide, NodeIconKey, NodeMappingStatus } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { NODE_H, NODE_W } from "./geometry";

export const nodeIcons: Record<NodeIconKey, (p: { className?: string }) => ReactNode> = {
  door: DoorIcon,
  flag: FlagIcon,
  shop: ShopIcon,
  players: PlayersIcon,
  trophy: TrophyIcon,
  portal: PortalIcon,
  roblox: RobloxNodeIcon,
  node: NodeIcon,
};

/** Edit node 팝오버의 아이콘 선택지 순서 (Figma) */
export const iconOptions: NodeIconKey[] = ["door", "flag", "shop", "players", "trophy", "portal", "roblox"];

/** 노드 아래 상태 줄: 매핑 상태 + 로깅 상태 (idle = "0 tracked", tracked = "n events") */
export type NodeRowStatus = NodeMappingStatus | "idle" | "tracked";

export type NodeVisualState = "default" | "hover" | "selected" | "moving" | "dropTarget" | "reviewed";

/** Figma `Node / Mapping status` 아래 상태 줄 높이 */
export const STATUS_ROW_H = 40;

const statusStyle: Record<
  NodeRowStatus,
  { bg: string | null; divider: string; glow: string | null; color: string }
> = {
  requiresReview: {
    bg: "--gc-bg-node-status-critical",
    divider: "--gc-border-node-divider-critical",
    glow: "--gc-effect-node-glow-critical",
    color: "text-status-critical",
  },
  pending: {
    bg: "--gc-bg-node-status-pending",
    divider: "--gc-border-node-divider-pending",
    glow: "--gc-effect-node-glow-pending",
    color: "text-status-pending",
  },
  ready: {
    bg: "--gc-bg-node-status-tracked",
    divider: "--gc-border-node-divider-positive",
    glow: "--gc-effect-node-glow",
    color: "text-status-positive",
  },
  fullyMapped: {
    bg: "--gc-bg-node-status-tracked",
    divider: "--gc-border-node-divider-positive",
    glow: "--gc-effect-node-glow",
    color: "text-status-positive",
  },
  // 확인 중 (Save 후 3초): 중립색 + 스피너
  checking: { bg: null, divider: "--gc-border-default", glow: null, color: "text-text-secondary" },
  // Figma `Node / Tracking status` Not tracked: 바탕 node-status-idle만, 회색 점
  idle: { bg: null, divider: "--gc-border-default", glow: null, color: "text-text-secondary" },
  // Tracked: node-inset + node-status-tracked, 구분선 node-divider-tracked, glow node-glow
  tracked: {
    bg: "--gc-bg-node-status-tracked",
    divider: "--gc-border-node-divider-tracked",
    glow: "--gc-effect-node-glow",
    color: "text-status-positive",
  },
};

// 상태 줄: 바탕 node-inset + 상태 틴트, 위 구분선, 안쪽 glow 16
function StatusRow({ status, count = 0 }: { status: NodeRowStatus; count?: number }) {
  const { t } = useI18n();
  const s = statusStyle[status];
  const label = {
    requiresReview: t.nodeStatus.requiresReview(1),
    pending: t.nodeStatus.pending(1),
    ready: t.nodeStatus.ready,
    fullyMapped: t.nodeStatus.fullyMapped,
    checking: t.nodeStatus.checking,
    idle: t.logging.tracked.notTracked,
    tracked: t.logging.tracked.eventCount(count),
  }[status];
  const icon =
    status === "idle" || status === "tracked" ? (
      // Icon / online (8): 채운 점
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${status === "idle" ? "bg-icon-secondary" : "bg-status-positive"}`}
      />
    ) : status === "requiresReview" ? (
      <WarningSmIcon className="shrink-0" />
    ) : status === "pending" ? (
      <ClockSmIcon className="shrink-0" />
    ) : status === "checking" ? (
      <span aria-hidden className="size-4 shrink-0 rounded-full border-2 border-border-default border-t-text-primary" style={{ animation: "gc-spin 900ms linear infinite" }} />
    ) : (
      <CheckSmIcon className="shrink-0" />
    );
  return (
    <div
      // 상태가 바뀔 때(Checking… → 결과) 한 번 반짝하며 켜진다 (디자이너 요청). key로 바뀔 때만 재생
      key={status}
      className={`flex h-[39px] shrink-0 items-center gap-2 rounded-b-[7px] px-[15px] ${s.color}`}
      style={{
        background:
          status === "idle"
            ? "var(--gc-bg-node-status-idle)"
            : `${s.bg ? `linear-gradient(var(${s.bg}), var(${s.bg})), ` : ""}var(--gc-bg-node-inset)`,
        // Figma 그대로: 위 구분선 1px + 안쪽 glow 16px (effect/node-glow*)
        boxShadow: `inset 0 1px 0 var(${s.divider})${s.glow ? `, inset 0 0 16px var(${s.glow})` : ""}`,
        animation: status === "checking" || status === "idle" ? undefined : "gc-light-up 600ms ease-out",
      }}
    >
      {icon}
      <span className="truncate text-label-default">{label}</span>
    </div>
  );
}

// Figma `Node / Structure` 원본 값.
// 흰색 5% 그라디언트·흰색 inner shadow는 Figma 컴포넌트에 토큰 없이 들어간 값을 그대로 쓴다.
const SURFACE_SHEEN = "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)";
const BORDER_GRADIENT =
  "linear-gradient(180deg, var(--gc-border-node-0) 0%, var(--gc-border-node-1) 50%, var(--gc-border-node-2) 100%)";

const solid = (token: string) => `linear-gradient(var(${token}), var(${token})) padding-box`;

// 위에서부터: 흰 sheen → (hover 레이어) → 바탕색 → 테두리 그라디언트(border-box).
// 선택 계열 테두리는 ring 오버레이가 덮는다.
function nodeBackground(state: NodeVisualState) {
  const layers = [`${SURFACE_SHEEN} padding-box`];
  if (state === "hover") layers.push(solid("--gc-bg-hover-subtle"));
  layers.push(solid(state === "dropTarget" ? "--gc-bg-selected" : "--gc-bg-surface"));
  layers.push(`${BORDER_GRADIENT} border-box`);
  return layers.join(", ");
}

function nodeShadow(state: NodeVisualState) {
  const inner =
    state === "dropTarget"
      ? "inset 0 0 8px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.14)"
      : "inset 0 0 8px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1)";
  const outer =
    state === "moving"
      ? "0 0 0 4px var(--gc-effect-selected-ring), 0 12px 32px 0 var(--gc-effect-shadow-lifted)"
      : "0 4px 12px 0 var(--gc-effect-shadow)";
  return `${inner}, ${outer}`;
}

export function NodeHandle({
  side,
  pressed,
  onPointerDown,
}: {
  side: HandleSide;
  pressed: boolean;
  onPointerDown?: (e: ReactPointerEvent) => void;
}) {
  const pos: Record<HandleSide, string> = {
    top: "left-1/2 top-0",
    bottom: "left-1/2 top-full",
    left: "left-0 top-1/2",
    right: "left-full top-1/2",
  };
  return (
    // 12px 원(stroke 가운데 정렬) + 눌러 잡기 쉬운 24px 영역
    <span
      data-handle={side}
      onPointerDown={onPointerDown}
      className={`absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center cursor-crosshair ${pos[side]}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <circle
          cx="7"
          cy="7"
          r="6"
          fill={pressed ? "var(--gc-chart-bar-emphasis)" : "var(--gc-bg-canvas)"}
          stroke="var(--gc-border-accent)"
          strokeWidth={pressed ? 2 : 1.5}
        />
      </svg>
    </span>
  );
}

export function CanvasNode({
  x,
  y,
  title,
  role,
  icon,
  state,
  ghost = false,
  handles = false,
  pressedHandle = null,
  editingTitle = false,
  enterDelay,
  status,
  statusCount,
  clickable = false,
  onTitleCommit,
  onPointerDown,
  onHandlePointerDown,
  onDoubleClick,
  onContextMenu,
  onPointerEnter,
  onPointerLeave,
}: {
  x: number;
  y: number;
  title: string;
  role: string;
  icon: NodeIconKey;
  state: NodeVisualState;
  /** 그룹 밖으로 끌고 있을 때 원래 자리에 남는 흐린 노드 */
  ghost?: boolean;
  handles?: boolean;
  pressedHandle?: HandleSide | null;
  editingTitle?: boolean;
  /** 처음 나타날 때 떠오르는 애니메이션 지연(ms). 없으면 애니메이션 없음 */
  enterDelay?: number;
  /** Step 3 노드 아래 상태 줄 (Figma `Node / Mapping status`) */
  status?: NodeRowStatus;
  /** status가 tracked일 때 이벤트 수 */
  statusCount?: number;
  /** 클릭만 되는 노드 (Step 2·3) */
  clickable?: boolean;
  onTitleCommit?: (value: string | null) => void;
  onPointerDown?: (e: ReactPointerEvent) => void;
  onHandlePointerDown?: (side: HandleSide, e: ReactPointerEvent) => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const Icon = nodeIcons[icon];
  const ring =
    state === "selected" || state === "moving"
      ? "var(--gc-border-accent)"
      : state === "reviewed"
        ? "var(--gc-status-positive)"
        : null;

  return (
    <div
      data-node
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={`absolute flex flex-col rounded-[8px] border border-transparent select-none ${ghost ? "opacity-40" : ""} ${clickable ? "cursor-pointer" : ""}`}
      style={{
        left: x,
        top: y,
        width: NODE_W,
        height: NODE_H + (status ? STATUS_ROW_H : 0),
        background: nodeBackground(state),
        boxShadow: nodeShadow(state),
        animation:
          enterDelay !== undefined ? `gc-rise-in 420ms ${enterDelay}ms cubic-bezier(0.2,0.8,0.2,1) both` : undefined,
      }}
    >
      {ring && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-px z-10 rounded-[8px]"
          style={{ boxShadow: `inset 0 0 0 1.5px ${ring}` }}
        />
      )}
      {state === "dropTarget" && (
        <svg aria-hidden className="pointer-events-none absolute -inset-px overflow-visible" width={NODE_W} height={NODE_H}>
          <rect x="0.75" y="0.75" width={NODE_W - 1.5} height={NODE_H - 1.5} rx="7.25" fill="none" stroke="var(--gc-border-accent)" strokeWidth="1.5" strokeDasharray="6 4" />
        </svg>
      )}

      {/* 본문 (Figma p16, 테두리 1px는 border가 차지하므로 15) */}
      <div className="flex h-[95px] shrink-0 flex-col gap-2 px-[15px] pt-[15px]">
        <div className="flex h-8 w-full items-center gap-2">
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] text-icon-secondary inset-ring inset-ring-border-default inset-shadow-[0_1px_0_rgba(255,255,255,0.08)] ${
              state === "dropTarget" ? "bg-chart-flow-line" : "bg-bg-node-inset"
            }`}
          >
            <Icon className="shrink-0" />
          </span>
          {editingTitle ? (
            <TitleInput initial={title} onCommit={(v) => onTitleCommit?.(v)} />
          ) : (
            <span className="min-w-0 flex-1 truncate text-fs-16 leading-[1.6] font-bold text-text-primary">{title}</span>
          )}
        </div>
        <span className="truncate text-label-default text-text-secondary">{role}</span>
      </div>

      {status && <StatusRow status={status} count={statusCount} />}

      {handles &&
        (["top", "right", "bottom", "left"] as HandleSide[]).map((side) => (
          <NodeHandle
            key={side}
            side={side}
            pressed={pressedHandle === side}
            onPointerDown={(e) => onHandlePointerDown?.(side, e)}
          />
        ))}
    </div>
  );
}

// 새 노드를 추가하면 제목을 바로 고칠 수 있게 연다. Enter/바깥 클릭 = 저장, Esc = 취소.
function TitleInput({ initial, onCommit }: { initial: string; onCommit: (value: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      defaultValue={initial}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") onCommit(e.currentTarget.value);
        if (e.key === "Escape") onCommit(null);
      }}
      onBlur={(e) => onCommit(e.currentTarget.value)}
      className="min-w-0 flex-1 bg-transparent text-fs-16 leading-[1.6] font-bold text-text-primary outline-none focus-visible:outline-none"
    />
  );
}
