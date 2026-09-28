"use client";

import { useRef } from "react";
import { ChevronIcon } from "@/components/icons";
import { useDismiss } from "@/lib/use-dismiss";
import { MenuOption, MenuPanel } from "./menu";

// Figma `Select / Filter` + 드롭다운.
// - 트리거 아래 8px, 트리거 중앙에 맞춰 펼친다.
// - 옵션을 골라도 닫히지 않고, 화살표(트리거)나 바깥을 누르면 닫힌다.
// - 여러 개 중 하나만 열리도록 open 상태는 부모가 관리한다.

type FilterSelectProps<T extends string> = {
  label: string;
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FilterSelect<T extends string>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  open,
  onOpenChange,
}: FilterSelectProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => onOpenChange(false));

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex h-control-48 items-center gap-3 rounded-lg inset-ring inset-ring-border-default bg-bg-surface px-4 text-text-secondary cursor-pointer hover:text-text-primary"
      >
        <span className="text-body-default whitespace-nowrap">{label}</span>
        <span className={`flex h-[5px] w-[10px] items-center justify-center ${open ? "rotate-180" : ""}`}>
          <ChevronIcon className="shrink-0" />
        </span>
      </button>
      {open && (
        <MenuPanel radius="lg" className="absolute top-[calc(100%+8px)] left-1/2 min-w-full -translate-x-1/2">
          {options.map((option) => (
            <MenuOption
              key={option.value}
              selected={option.value === value}
              onSelect={() => onChange(option.value)}
              className="h-control-40 text-body-default"
            >
              {option.label}
            </MenuOption>
          ))}
        </MenuPanel>
      )}
    </div>
  );
}
