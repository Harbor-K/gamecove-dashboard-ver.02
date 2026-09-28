"use client";

import { useLayoutEffect, useRef, type ReactNode, type Ref } from "react";
import { CloseIcon } from "@/components/icons-mapping";

// Figma `Drawer / Node detail` · `Drawer / Review node`: w480, bg surface, 왼쪽 테두리, 그림자 -8 0 24.
// 머리(h80)와 발(Save)은 고정, 가운데 내용만 세로 스크롤.
export const DRAWER_W = 480;

export function Drawer({
  icon,
  title,
  closeLabel,
  onClose,
  footer,
  children,
}: {
  icon: ReactNode;
  title: string;
  closeLabel: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <DrawerFrame
      header={
        <header className="flex h-20 shrink-0 items-center gap-4 p-6 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-bg-canvas text-icon-secondary inset-ring inset-ring-border-default">
              {icon}
            </span>
            <h2 className="truncate text-[20px] leading-[1.3] font-bold text-text-primary">{title}</h2>
          </div>
          <DrawerClose label={closeLabel} onClick={onClose} />
        </header>
      }
      footer={footer}
    >
      <div className="flex flex-col gap-6 p-6">{children}</div>
    </DrawerFrame>
  );
}

/** 드로어 틀: 머리·발 고정, 가운데만 세로 스크롤. 내용 여백은 각 드로어가 정한다 */
export function DrawerFrame({
  header,
  footer,
  children,
  bodyRef,
  onBodyScroll,
  overlay,
  animate = true,
}: {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyRef?: Ref<HTMLDivElement>;
  onBodyScroll?: () => void;
  /** 본문(스크롤 영역) 위를 덮는 것 — 스크롤과 상관없이 보이는 영역 전체 */
  overlay?: ReactNode;
  /** false면 들어오는 애니메이션 없음 (같은 드로어 안에서 단계만 바뀔 때) */
  animate?: boolean;
}) {
  return (
    <aside
      className="absolute top-0 right-0 bottom-0 z-40 flex flex-col bg-bg-surface shadow-[inset_1px_0_0_var(--gc-border-default),-8px_0_24px_0_var(--gc-effect-shadow)]"
      style={{
        width: DRAWER_W,
        animation: animate ? "gc-drawer-in 280ms cubic-bezier(0.2,0.8,0.2,1) both" : undefined,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {header}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={bodyRef} onScroll={onBodyScroll} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
        {overlay}
      </div>
      {footer && (
        <footer className="flex shrink-0 items-center justify-end gap-3 p-6 shadow-[inset_0_1px_0_var(--gc-border-default)]">
          {footer}
        </footer>
      )}
    </aside>
  );
}

/** 드로어 X (20, stroke 2, icon-secondary) */
export function DrawerClose({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-5 shrink-0 items-center justify-center text-icon-secondary icon-hit hover:text-icon-primary"
    >
      <CloseIcon />
    </button>
  );
}

/**
 * 내용에 맞춰 높이가 늘어나는 입력창. 여백·간격은 Figma 그대로 두고 줄 수만 늘어난다 (내부 스크롤 없음).
 * 한 줄일 때 48px (Figma `Input` h48, 글자 16/1.6 = 25.6 + 위아래 11.2).
 */
export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 1,
  className = "",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full resize-none overflow-hidden bg-transparent text-body-default text-text-primary caret-text-primary outline-none placeholder:text-text-secondary focus-visible:outline-none ${className}`}
    />
  );
}
