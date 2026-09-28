"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

// Logging setup · Tracked 화면에서 함께 쓰는 작은 조각들 (Figma 컴포넌트 값 그대로)

/** Figma `Button / Small`: h32 px12 radius 8, 1px 테두리, 14 Regular primary. hover = color/bg/hover */
export function SmallButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-8 shrink-0 items-center rounded-md px-3 text-label-default whitespace-nowrap text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Figma `Chip / Data`: h32 px16 radius 999, bg surface, 1px 테두리, 14 Regular */
export function DataChip({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={`flex h-8 shrink-0 items-center rounded-full bg-bg-surface px-4 text-label-default whitespace-nowrap inset-ring inset-ring-border-default ${
        muted ? "text-text-secondary" : "text-text-primary"
      }`}
    >
      {children}
    </span>
  );
}

/** 상태 점 (8). positive = 추적 중, pending = 대기, inactive = 꺼짐, critical = 설정 필요 */
export type DotTone = "positive" | "pending" | "inactive" | "critical";
const dotColor: Record<DotTone, string> = {
  positive: "bg-status-positive",
  pending: "bg-status-pending",
  inactive: "bg-text-secondary",
  critical: "bg-status-critical",
};
export function Dot({ tone, size = 8 }: { tone: DotTone; size?: 8 | 10 }) {
  return <span aria-hidden className={`shrink-0 rounded-full ${dotColor[tone]} ${size === 8 ? "size-2" : "size-2.5"}`} />;
}

/** 버튼 안 스피너 (저장 중). 글자 자리를 그대로 두고 가운데에 돈다 */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block size-4 rounded-full border-2 border-current border-r-transparent ${className}`}
      style={{ animation: "gc-spin 800ms linear infinite" }}
    />
  );
}

/** 저장 중이면 라벨 자리를 유지한 채 스피너만 보인다 */
export function LoadingLabel({ loading, children }: { loading: boolean; children: ReactNode }) {
  if (!loading) return <>{children}</>;
  return (
    <span className="relative inline-flex items-center justify-center">
      <span className="invisible">{children}</span>
      <span className="absolute inset-0 flex items-center justify-center">
        <Spinner />
      </span>
    </span>
  );
}
