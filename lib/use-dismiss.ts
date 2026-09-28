"use client";

import { useEffect, type RefObject } from "react";

/**
 * 열려 있는 메뉴를 바깥 클릭 / Escape로 닫는다. ref 안(트리거 + 메뉴)의 클릭은 무시.
 * 트리거가 ref 밖에 있으면(포털 팝오버) ignore로 넘긴다 — 트리거를 다시 누르면 트리거가 토글로 닫는다.
 */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
  ignore?: Element | null,
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ignore?.contains(target)) return;
      if (ref.current && !ref.current.contains(target)) onDismiss();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, onDismiss, ignore]);
}
