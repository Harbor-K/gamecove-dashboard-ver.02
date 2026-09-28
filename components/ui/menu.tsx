import type { ReactNode } from "react";
import { CheckIcon } from "@/components/icons";

// 떠 있는 메뉴 컨테이너 (Dropdown / Theme menu 공통).
// 간격 규칙: 메뉴 padding 8, 옵션 간격 4, radius 8, 1px color/border/default.
// 예외: 워크스페이스 필터 드롭다운은 radius 16 (검색·필터 트리거가 16이라서).
export function MenuPanel({
  radius = "md",
  className = "",
  children,
}: {
  radius?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="menu"
      className={`z-40 flex flex-col gap-1 ${radius === "lg" ? "rounded-lg" : "rounded-md"} inset-ring inset-ring-border-default bg-bg-surface p-2 shadow-[0_8px_24px_0_var(--gc-effect-shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

// 메뉴 옵션. 선택 = text primary + 체크, 기본 = secondary, hover = color/bg/hover + primary.
export function MenuOption({
  selected,
  onSelect,
  icon,
  className = "",
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex shrink-0 items-center gap-2 rounded-md px-2 text-left cursor-pointer hover:bg-bg-hover hover:text-text-primary ${selected ? "text-text-primary" : "text-text-secondary"} ${className}`}
    >
      {icon}
      <span className="flex-1 whitespace-nowrap">{children}</span>
      {selected && <CheckIcon className="shrink-0" />}
    </button>
  );
}
