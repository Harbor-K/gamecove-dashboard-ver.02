"use client";

import { useEffect, type ReactNode } from "react";

// 가운데 모달 + scrim (color/bg/scrim). 등장: scrim 페이드 + 모달 살짝 확대되며 떠오름.
// closing=true면 퇴장 애니메이션을 재생한다 (언마운트는 부모가 onExited 이후에).
export const MODAL_EXIT_MS = 180;

export function Modal({
  open,
  closing = false,
  onEscape,
  labelledBy,
  className = "",
  contained = false,
  children,
}: {
  open: boolean;
  closing?: boolean;
  onEscape?: () => void;
  labelledBy?: string;
  className?: string;
  /** true면 내비·상단 바를 뺀 본문 영역 가운데에 띄운다 (AppShell이 --gc-content-left를 정한다). scrim은 화면 전체 */
  contained?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open || !onEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onEscape]);

  if (!open) return null;
  return (
    <div
      className={`fixed z-50 flex items-center justify-center ${contained ? "top-14 right-0 bottom-0" : "inset-0"}`}
      style={contained ? { left: "var(--gc-content-left, 0px)" } : undefined}
    >
      <div
        aria-hidden
        className="fixed inset-0 bg-bg-scrim"
        style={{ animation: `${closing ? "gc-fade-out" : "gc-fade-in"} ${closing ? MODAL_EXIT_MS : 200}ms ease-out forwards` }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative ${className}`}
        style={{
          animation: `${closing ? "gc-pop-out" : "gc-pop-in"} ${closing ? MODAL_EXIT_MS : 260}ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
