"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { InfoIcon } from "@/components/icons-dashboard";
import { uiZoom } from "@/lib/zoom";

// Figma `Tooltip`: 14 Regular 1.6, color/bg/tooltip, 테두리 color/border/tooltip, radius 8, p12, 최대 w306.
// body에 띄워서(portal) 드로어 스크롤 영역에 잘리지 않고, 화면 가장자리를 넘지 않게 좌우를 맞춘다.
// 글자 선택·드래그에 걸리지 않도록 pointer-events 없음 + select-none.
const EDGE = 8;
const GAP = 8;

export function HoverTooltip({ text, children, delay = 0 }: { text: string; children: ReactNode; delay?: number }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    setPos(null);
  };

  // 크기를 잰 뒤 위치를 정한다: 기준 가운데 위, 화면 밖으로 나가면 안쪽으로, 위가 모자라면 아래로
  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !tipRef.current) return;
    // 화면 px → CSS px (화면 전체 배율)로 바꿔서 계산한다
    const z = uiZoom();
    const ar = anchorRef.current.getBoundingClientRect();
    const tr = tipRef.current.getBoundingClientRect();
    const a = { left: ar.left / z, top: ar.top / z, bottom: ar.bottom / z, width: ar.width / z };
    const tip = { width: tr.width / z, height: tr.height / z };
    const left = Math.min(Math.max(EDGE, a.left + a.width / 2 - tip.width / 2), window.innerWidth / z - tip.width - EDGE);
    const above = a.top - GAP - tip.height;
    setPos({ left, top: above >= EDGE ? above : a.bottom + GAP });
  }, [open, text]);

  return (
    <span ref={anchorRef} className="relative flex" onPointerEnter={show} onPointerLeave={hide} onPointerDown={hide}>
      {children}
      {open &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[100] w-max max-w-[306px] rounded-md bg-bg-tooltip p-3 text-fs-14 leading-[1.6] font-normal text-text-tooltip select-none inset-ring inset-ring-border-tooltip shadow-[0_8px_24px_0_var(--gc-effect-shadow)]"
            style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}

/** ⓘ 아이콘 + 툴팁 */
export function InfoTooltip({
  text,
  tone = "secondary",
  size = 16,
  strokeWidth = 1.5,
}: {
  text: string;
  /** 아이콘 크기·선 두께 (Figma 인스턴스 값) */
  size?: number;
  strokeWidth?: number;
  /** 아이콘 기본색 (Figma: 섹션 제목 옆 primary, 세부 라벨 옆 secondary) */
  tone?: "primary" | "secondary";
}) {
  return (
    <HoverTooltip text={text}>
      <span
        style={{ width: size, height: size }}
        className={`flex items-center justify-center hover:text-icon-primary ${
          tone === "primary" ? "text-icon-primary" : "text-icon-secondary"
        }`}
      >
        <InfoIcon size={size} strokeWidth={strokeWidth} />
      </span>
    </HoverTooltip>
  );
}
