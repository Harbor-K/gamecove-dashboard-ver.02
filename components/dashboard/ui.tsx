"use client";

import { useRef, useState, type ReactNode } from "react";
import { CheckboxIcon } from "@/components/icons-mapping";
import {
  ArrowLeftIcon,
  CheckSmallIcon,
  CloseChipIcon,
  ChevronRightXsIcon,
  MoreVerticalIcon,
  SelectChevronIcon,
  TriangleIcon,
} from "@/components/icons-dashboard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { Delta } from "@/data/dashboard/types";
import { useI18n } from "@/lib/i18n";
import { useDismiss } from "@/lib/use-dismiss";

// 대시보드 카드 공통 조각 (Figma `Card / Title`, `Card / Actions`, `Segmented control`, `Card / Back bar`,
// `Dropdown / Option`, `Delta chip`, …). 값은 모두 props로 받는다.

/** Figma 카드 틀: bg surface, 1px 테두리, radius 16 */
export function CardShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    // 차트·행을 누르거나 끌 때 글자가 선택되지 않게 (select-none)
    <section className={`flex w-full flex-col rounded-lg bg-bg-surface select-none inset-ring inset-ring-border-default ${className}`}>
      {children}
    </section>
  );
}

/** Figma `Card / Title`: 24 Bold 1.5 + ⓘ 24 (stroke 1.5), gap 8 */
export function CardTitle({ title, info }: { title: string; info: string }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-[24px] leading-[1.5] font-bold whitespace-nowrap text-text-primary">{title}</h2>
      <InfoTooltip text={info} tone="primary" size={24} strokeWidth={1.5} />
    </div>
  );
}

// ── 떠 있는 메뉴 ─────────────────────────────────────────────────────────────
/** Figma `Dropdown` 틀: bg surface, 1px, radius 8, p8 gap4, 그림자 0 8 24 */
export function DropdownPanel({
  children,
  className = "",
  shadow = "md",
}: {
  children: ReactNode;
  className?: string;
  /** Page actions 메뉴만 0 12 32 */
  shadow?: "md" | "lg";
}) {
  return (
    <div
      role="menu"
      onPointerDown={(e) => e.stopPropagation()}
      className={`z-40 flex flex-col gap-1 rounded-md bg-bg-surface p-2 inset-ring inset-ring-border-default ${
        shadow === "lg" ? "shadow-[0_12px_32px_0_var(--gc-effect-shadow)]" : "shadow-[0_8px_24px_0_var(--gc-effect-shadow)]"
      } ${className}`}
      style={{ animation: "gc-fade-in 120ms ease-out both" }}
    >
      {children}
    </div>
  );
}

/**
 * Figma `Dropdown / Option`: h40 px8 gap8 radius 8, 16/1.6.
 * State: Selected = primary + ✓, Default = secondary, Action = primary (메뉴 동작). hover = color/bg/hover
 */
export function DropdownOption({
  children,
  state = "action",
  trailing,
  onClick,
}: {
  children: ReactNode;
  state?: "selected" | "default" | "action";
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role={state === "action" ? "menuitem" : "menuitemradio"}
      aria-checked={state === "action" ? undefined : state === "selected"}
      onClick={onClick}
      className={`flex h-control-40 w-full shrink-0 items-center justify-between gap-2 rounded-md px-2 text-left text-fs-16 leading-[1.6] whitespace-nowrap cursor-pointer hover:bg-bg-hover hover:text-text-primary ${
        state === "default" ? "text-text-secondary" : "text-text-primary"
      }`}
    >
      <span>{children}</span>
      {state === "selected" && <CheckSmallIcon className="shrink-0 text-icon-primary" />}
      {trailing}
    </button>
  );
}

/** Figma `Dropdown / Divider`: py4, 1px */
export function DropdownDivider() {
  return (
    <div className="py-1">
      <div className="h-px w-full bg-border-default" />
    </div>
  );
}

/** Figma `Dropdown / Section title`: p 8/8/4/8, 14 primary */
export function DropdownSectionTitle({ children }: { children: ReactNode }) {
  return <div className="px-2 pt-2 pb-1 text-label-default text-text-primary">{children}</div>;
}

/** Figma `Dropdown / Checkbox option`: h40 px8 gap8. 체크 = primary, 아니면 secondary */
export function CheckboxOption({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex h-control-40 w-full shrink-0 items-center gap-2 rounded-md px-2 text-left text-fs-16 leading-[1.6] cursor-pointer hover:bg-bg-hover hover:text-text-primary ${
        checked ? "text-text-primary" : "text-text-secondary"
      }`}
    >
      <span className={checked ? "text-icon-primary" : "text-icon-secondary"}>
        <CheckboxIcon checked={checked} className="shrink-0" />
      </span>
      {label}
    </button>
  );
}

/** 트리거 + 아래로 펼치는 메뉴. 바깥 클릭·Esc로 닫힘 */
export function Popover({
  trigger,
  children,
  align = "start",
  offset = 8,
  className = "",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  offset?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div className={`absolute z-40 ${align === "end" ? "right-0" : "left-0"}`} style={{ top: `calc(100% + ${offset}px)` }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// ── 카드 머리 오른쪽 ──────────────────────────────────────────────────────────
/** Figma `Card / Actions`: Explore(Secondary 작은 버튼) + ⋮ → Menu / Card actions */
export function CardActions({ onExplore }: { onExplore: () => void }) {
  const { t } = useI18n();
  const secondary =
    "flex h-9 items-center justify-center rounded-md border border-border-button-secondary bg-bg-button-secondary bg-clip-padding text-text-button-secondary cursor-pointer hover:bg-bg-hover hover:text-text-primary";
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={onExplore} className={`${secondary} px-[11px] text-label-default`}>
        {t.dashboard.explore}
      </button>
      <Popover
        align="end"
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-label={t.dashboard.moreActions}
            aria-expanded={open}
            onClick={toggle}
            className={`${secondary} w-8 text-icon-button-secondary ${open ? "bg-bg-selected" : ""}`}
          >
            <MoreVerticalIcon />
          </button>
        )}
      >
        {(close) => (
          <DropdownPanel className="w-60">
            {(["downloadCsv", "viewSourceQuery", "addToDashboard"] as const).map((key) => (
              <DropdownOption key={key} onClick={close}>
                {t.dashboard.cardActions[key]}
              </DropdownOption>
            ))}
          </DropdownPanel>
        )}
      </Popover>
    </div>
  );
}

/** Figma `Segmented control`: 1px 테두리 radius 8, 칸 h34 px16 14 Regular. 선택 = bg selected + primary */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" className="flex h-9 items-stretch overflow-hidden rounded-md inset-ring inset-ring-border-default p-px">
      {options.map((o, i) => (
        <div key={o.value} className="flex items-stretch">
          {i > 0 && <span aria-hidden className="w-px bg-border-default" />}
          <button
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={`flex items-center px-4 text-label-default whitespace-nowrap cursor-pointer ${
              o.value === value ? "bg-bg-selected text-text-primary" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            }`}
          >
            {o.label}
          </button>
        </div>
      ))}
    </div>
  );
}

/** 카드 안 기간 선택 (Figma `Select / Date range`: 테두리 없는 h40 px16, 16/1.5 + 10×5 chevron) → Dropdown / Date range */
export function CardDateSelect() {
  const { t } = useI18n();
  const [value, setValue] = useState<"last7days" | "custom">("last7days");
  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className={`flex h-control-40 items-center gap-2 rounded-md px-4 text-fs-16 leading-[1.5] text-text-primary cursor-pointer hover:bg-bg-hover ${open ? "bg-bg-hover" : ""}`}
        >
          {t.dashboard.filters[value]}
          <SelectChevronIcon className={`text-icon-primary ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    >
      {(close) => (
        <DateRangeMenu
          value={value}
          onChange={(v) => {
            setValue(v);
            close();
          }}
        />
      )}
    </Popover>
  );
}

/** Figma `Dropdown / Date range`: Last 7 days ✓ / 구분선 / Custom > */
export function DateRangeMenu({ value, onChange }: { value: "last7days" | "custom"; onChange: (v: "last7days" | "custom") => void }) {
  const { t } = useI18n();
  return (
    <DropdownPanel className="w-[248px]">
      <DropdownOption state={value === "last7days" ? "selected" : "default"} onClick={() => onChange("last7days")}>
        {t.dashboard.filters.last7days}
      </DropdownOption>
      <DropdownDivider />
      <DropdownOption
        state="default"
        trailing={<ChevronRightXsIcon className="shrink-0 text-icon-secondary" />}
        onClick={() => onChange("last7days")}
      >
        {t.dashboard.filters.custom}
      </DropdownOption>
    </DropdownPanel>
  );
}

/** 카드 안 Filter by (Figma `Button / Filter by`: 테두리 없는 h40 px16) → 카테고리 체크 드롭다운 (+ Reset) */
export function CardFilterBy({
  groups,
  checked,
  onChange,
}: {
  groups: CheckGroup[];
  checked: string[];
  onChange: (checked: string[]) => void;
}) {
  const { t } = useI18n();
  return (
    <Popover
      align="end"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          aria-expanded={open}
          onClick={toggle}
          className={`flex h-control-40 items-center rounded-md px-4 text-fs-16 leading-[1.5] text-text-primary cursor-pointer hover:bg-bg-hover ${open ? "bg-bg-hover" : ""}`}
        >
          {t.dashboard.filters.filterBy}
        </button>
      )}
    >
      {() => <CheckGroupsMenu groups={groups} checked={checked} onChange={onChange} onReset={() => onChange([])} />}
    </Popover>
  );
}

export type CheckGroup = { id: string; title: string; options: { value: string; label: string }[] };

/** Figma `Dropdown / Breakdown by`: 카테고리별 체크 목록 (w240) */
export function CheckGroupsMenu({
  groups,
  checked,
  onChange,
  onReset,
}: {
  groups: CheckGroup[];
  checked: string[];
  onChange: (checked: string[]) => void;
  /** 아래 Reset 버튼 (선택 모두 해제) */
  onReset?: () => void;
}) {
  const { t } = useI18n();
  const toggle = (v: string) => onChange(checked.includes(v) ? checked.filter((x) => x !== v) : [...checked, v]);
  return (
    <DropdownPanel className="w-60">
      {groups.map((g, i) => (
        <div key={g.id} className="flex flex-col gap-1">
          {i > 0 && <DropdownDivider />}
          <DropdownSectionTitle>{g.title}</DropdownSectionTitle>
          {g.options.map((o) => (
            <CheckboxOption key={o.value} label={o.label} checked={checked.includes(o.value)} onToggle={() => toggle(o.value)} />
          ))}
        </div>
      ))}
      {onReset && (
        <>
          <DropdownDivider />
          <div className="flex justify-end px-1 pb-1">
            <button
              type="button"
              onClick={onReset}
              disabled={checked.length === 0}
              className="flex h-8 items-center rounded-md px-3 text-label-default text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {t.dashboard.filters.resetAll}
            </button>
          </div>
        </>
      )}
    </DropdownPanel>
  );
}

/** Figma `Filter chip`: h32 pl12 pr8 gap4, bg/bubble 50%, 14 SemiBold + × 16 */
export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useI18n();
  return (
    <span className="flex h-8 items-center gap-1 rounded-full bg-bg-bubble pr-2 pl-3 text-label-default font-semibold text-text-primary">
      {label}
      <button
        type="button"
        aria-label={t.dashboard.filters.removeFilter(label)}
        onClick={onRemove}
        className="flex size-4 items-center justify-center text-icon-primary icon-hit cursor-pointer"
      >
        <CloseChipIcon />
      </button>
    </span>
  );
}

/** 카드 머리의 기간·필터 묶음 + 세로 구분선 (Figma `Header right`) */
export function CardControls({
  groups,
  checked,
  onChange,
}: {
  groups: CheckGroup[];
  checked: string[];
  onChange: (checked: string[]) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <CardDateSelect />
        <CardFilterBy groups={groups} checked={checked} onChange={onChange} />
      </div>
      <span aria-hidden className="h-7 w-px bg-bg-subtle" />
    </>
  );
}

/** Figma `Card / Back bar`: h48 px24, 아래 1px, ← 24 + 16/1.5 */
export function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="group flex h-12 w-full shrink-0 items-center px-6 text-left shadow-[inset_0_-1px_0_var(--gc-border-default)] cursor-pointer"
    >
      <ArrowLeftIcon className="shrink-0 text-icon-secondary group-hover:text-icon-primary" />
      <span className="text-fs-16 leading-[1.5] text-text-primary">{label}</span>
    </button>
  );
}

/** Figma `Delta chip`: h24 pl8 pr12 gap4, 14 Regular. Positive/Negative = 상태색 배경, Neutral = bg/chip */
export function DeltaChip({ delta, label }: { delta: Delta; label: string }) {
  const tone =
    delta.tone === "positive"
      ? "bg-bg-positive-subtle text-text-positive"
      : delta.tone === "negative"
        ? "bg-bg-critical-subtle text-text-critical"
        : "bg-bg-chip text-text-primary";
  const icon = delta.tone === "neutral" ? "text-icon-primary" : "";
  return (
    <span className={`flex h-6 items-center gap-1 rounded-full pr-3 pl-2 text-label-default whitespace-nowrap ${tone}`}>
      <TriangleIcon direction={delta.direction} className={`shrink-0 ${icon}`} />
      {label}
    </span>
  );
}
