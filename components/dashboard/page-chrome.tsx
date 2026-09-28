"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAgent } from "@/components/agent/agent-provider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { OptionIcon, SelectChevronIcon } from "@/components/icons-dashboard";
import { CloseIcon } from "@/components/icons-mapping";
import type { DashboardFilters } from "@/data/dashboard/types";
import { dataThrough, defaultFilters, dimensionOf } from "@/lib/dashboard/queries";
import { useI18n } from "@/lib/i18n";
import { useRightInset } from "@/lib/right-inset";
import { useSharedState } from "@/lib/setup-store";
import { useCategoryGroups } from "./metric-cards";
import { CheckboxOption, CheckGroupsMenu, FilterChip, DateRangeMenu, DropdownDivider, DropdownOption, DropdownPanel, DropdownSectionTitle, Popover } from "./ui";

// 대시보드 페이지 틀: Content p48 gap48 (Figma). 머리 = 제목 40 Bold + 설명 16 + ⋮ (Menu / Page actions)

export function DashboardPageLayout({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-12 p-12">{children}</div>;
}

/** Figma `대시보드 페이지 타이틀+discription` */
export function PageHeader({
  title,
  description,
  actions = true,
  children,
}: {
  title: string;
  description?: string;
  /** ⋮ 페이지 메뉴 (Explore에는 없음) */
  actions?: boolean;
  children?: ReactNode;
}) {
  const { t, locale } = useI18n();
  return (
    <div className="flex w-full items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="text-[40px] leading-[1.1] font-bold tracking-[-0.02em] text-text-primary">{title}</h1>
        {description && <p className="text-body-default text-text-secondary">{description}</p>}
        {children}
      </div>
      {actions && (
      // 데이터 최신 시각 (⋮ 왼쪽, 14 secondary). dataset 시각을 그대로 보여 준다 (시간대 표기 없음)
      <div className="mt-[23px] flex shrink-0 items-center gap-4">
      <span className="text-label-default text-text-secondary">{formatDataThrough(t, locale, dataThrough())}</span>
      <Popover
        align="end"
        offset={4}
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-label={t.dashboard.moreActions}
            aria-expanded={open}
            onClick={toggle}
            className={`flex size-8 items-center justify-center rounded-md text-icon-primary cursor-pointer hover:bg-bg-hover ${open ? "bg-bg-hover" : ""}`}
          >
            <OptionIcon />
          </button>
        )}
      >
        {(close) => (
          <DropdownPanel className="w-[220px]" shadow="lg">
            {(["export", "scheduleReport", "refreshData"] as const).map((key) => (
              <DropdownOption key={key} onClick={close}>
                {t.dashboard.pageActions[key]}
              </DropdownOption>
            ))}
          </DropdownPanel>
        )}
      </Popover>
      </div>
      )}
    </div>
  );
}

/** "Data through Sep 21, 22:15" — 저장된 시각을 변환 없이 표시 (UTC 값 그대로) */
function formatDataThrough(t: ReturnType<typeof useI18n>["t"], locale: string, iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(d);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }).format(d);
  return t.dashboard.dataThrough(date, time);
}

/** 모든 대시보드 페이지가 같은 필터를 쓴다 (페이지를 옮겨도 유지) */
export function useDashboardFilters() {
  return useSharedState<DashboardFilters>("dash:filters", defaultFilters);
}

/** Figma `Select / …`: 라벨 14 secondary + h48 px12 bg surface 1px radius 8, 값 16/1.6 secondary + 10×5 chevron (chart/series/muted) */
function SelectField({
  label,
  value,
  width,
  menu,
}: {
  label: string;
  value: string;
  width: number;
  menu: (close: () => void) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2" style={{ width }}>
      <span className="text-label-default text-text-secondary">{label}</span>
      <Popover
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-expanded={open}
            onClick={toggle}
            style={{ width }}
            className="flex h-control-48 items-center justify-between gap-3 rounded-md bg-bg-surface px-3 text-fs-16 leading-[1.6] text-text-secondary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover hover:text-text-primary"
          >
            <span className="truncate">{value}</span>
            <SelectChevronIcon className={`shrink-0 text-chart-series-muted ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      >
        {menu}
      </Popover>
    </div>
  );
}

/**
 * Figma `Filters / Date, breakdown and interval`: gap16, 아래 정렬.
 * Date range · Filter by (→ Drawer / Filter by category) · 적용된 필터 칩 · … · Breakdown by · Time interval
 */
export function FiltersBar({ breakdown = true }: { breakdown?: boolean }) {
  const { t } = useI18n();
  const f = t.dashboard.filters;
  const [filters, setFilters] = useDashboardFilters();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const groups = useCategoryGroups();
  const applied = [...filters.device, ...filters.visitType, ...filters.country];
  const chipLabel = (v: string) => (v === "new" || v === "returning" ? f.chips[v] : f.options[v as keyof typeof f.options]);
  const remove = (v: string) =>
    setFilters((s) => ({
      ...s,
      device: s.device.filter((x) => x !== v),
      visitType: s.visitType.filter((x) => x !== v),
      country: s.country.filter((x) => x !== v),
    }));

  return (
    // 스크롤해도 상단 바 아래에 붙어 있는다 (제목은 올라가고 필터만 고정). 뒤 카드가 비치지 않게 배경 + 위아래 16
    <div className="sticky top-14 z-[15] -mx-12 -my-4 flex items-end gap-4 bg-bg-canvas px-12 py-4">
      <SelectField
        label={f.dateRange}
        value={f[filters.dateRange]}
        width={248}
        menu={(close) => (
          <DateRangeMenu
            value={filters.dateRange}
            onChange={(v) => {
              setFilters((s) => ({ ...s, dateRange: v }));
              close();
            }}
          />
        )}
      />
      <button
        type="button"
        aria-expanded={drawerOpen}
        data-filter-trigger
        // 열려 있으면 한 번 더 눌러 닫는다 (X와 같음 — 적용 안 한 변경은 버림)
        onClick={() => setDrawerOpen((o) => !o)}
        className="flex h-control-48 shrink-0 items-center rounded-md bg-bg-surface px-4 text-fs-16 leading-[1.6] text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover"
      >
        {f.filterBy}
      </button>
      {/* 적용된 필터 칩 (Figma `Filter chip`: h32 pl12 pr8 gap4, bg/bubble 50%, 14 SemiBold + × 16). 많으면 줄바꿈 */}
      <div className="flex min-w-0 flex-1 flex-wrap content-end items-end gap-2 self-center">
        {applied.map((v) => (
          <FilterChip key={v} label={chipLabel(v)} onRemove={() => remove(v)} />
        ))}
      </div>
      {breakdown && (
        <>
          <SelectField
            label={f.breakdownBy}
            value={filters.breakdown.length ? filters.breakdown.map(chipLabel).join(", ") : f.none}
            width={240}
            menu={() => (
              <CheckGroupsMenu
                groups={groups}
                checked={filters.breakdown}
                onChange={(checked) => setFilters((s) => ({ ...s, breakdown: singleDimension(s.breakdown, checked as DashboardFilters["breakdown"]) }))}
                onReset={() => setFilters((s) => ({ ...s, breakdown: [] }))}
              />
            )}
          />
          <SelectField
            label={f.timeInterval}
            value={f.days}
            width={192}
            menu={(close) => (
              <DropdownPanel className="w-48">
                <DropdownOption state="selected" onClick={close}>
                  {f.days}
                </DropdownOption>
              </DropdownPanel>
            )}
          />
        </>
      )}
      {drawerOpen && (
        <FilterDrawer
          initial={filters}
          onClose={() => setDrawerOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Breakdown은 한 차원만: 다른 차원의 값을 새로 체크하면 이전 차원 선택은 풀린다 */
function singleDimension(prev: DashboardFilters["breakdown"], next: DashboardFilters["breakdown"]) {
  const added = next.find((v) => !prev.includes(v));
  if (!added) return next;
  const dim = dimensionOf(added);
  return next.filter((v) => dimensionOf(v) === dim);
}

/** Figma `Drawer / Filter by category`: w480, 머리 h74 (20 SemiBold + X), 카테고리 p16/24 gap16, 발 Reset all + Apply */
function FilterDrawer({
  initial,
  onClose,
  onApply,
}: {
  initial: DashboardFilters;
  onClose: () => void;
  onApply: (next: DashboardFilters) => void;
}) {
  const { t } = useI18n();
  const f = t.dashboard.filters;
  const [draft, setDraft] = useState(initial);
  const groups = useCategoryGroups();
  // 드로어만큼 본문을 옆으로 민다
  useRightInset("filter-drawer", 480);

  // 적용 안 한 변경이 있는지 (드로어를 연 뒤 체크를 바꿨는지)
  const key = (d: DashboardFilters) => JSON.stringify([d.device, d.visitType, d.country].map((l) => [...l].sort()));
  const dirty = key(draft) !== key(initial);
  const asideRef = useRef<HTMLElement>(null);
  const [confirm, setConfirm] = useState<(() => void) | null>(null);

  // AI Agent를 누르면: 변경이 있으면 Apply 확인 모달 → 드로어를 닫고 Agent를 연다 (겹치지 않게). 변경이 없으면 바로 닫고 연다
  const agent = useAgent();
  const latest = useRef({ dirty, draft, onClose, onApply });
  useEffect(() => {
    latest.current = { dirty, draft, onClose, onApply };
  });
  useEffect(() => {
    agent.setOpenGuard((open) => {
      if (latest.current.dirty) setConfirm(() => open);
      else {
        latest.current.onClose();
        open();
      }
    });
    return () => agent.setOpenGuard(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.setOpenGuard]);

  // 변경이 없으면 드로어 밖(본문 등)을 눌러도 닫힌다
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (latest.current.dirty || asideRef.current?.contains(target)) return;
      // Filter by 버튼은 자기 클릭으로 토글한다
      if ((target as Element).closest?.("[data-filter-trigger]")) return;
      // 메뉴·모달 같은 떠 있는 레이어 안은 제외
      if ((target as Element).closest?.("[role=dialog],[role=menu]")) return;
      latest.current.onClose();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const finish = (apply: boolean) => {
    const open = confirm;
    setConfirm(null);
    if (apply) onApply(draft);
    else onClose();
    open?.();
  };
  type Group = "device" | "visitType" | "country";
  const toggle = (group: Group, v: string) =>
    setDraft((d) => {
      const list = d[group] as string[];
      return { ...d, [group]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] };
    });

  return (
    <>
    <aside
      ref={asideRef}
      className="fixed top-14 right-0 bottom-0 z-40 flex w-[480px] flex-col bg-bg-surface shadow-[inset_1px_0_0_var(--gc-border-default),-8px_0_24px_0_var(--gc-effect-shadow)]"
      style={{ animation: "gc-drawer-in 280ms cubic-bezier(0.2,0.8,0.2,1) both" }}
    >
      <header className="flex h-[74px] shrink-0 items-center justify-between p-6 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
        <h2 className="text-[20px] leading-[1.3] font-semibold text-text-primary">{f.filterByCategory}</h2>
        <button
          type="button"
          aria-label={f.close}
          onClick={onClose}
          className="flex size-5 items-center justify-center text-icon-secondary icon-hit cursor-pointer hover:text-icon-primary"
        >
          <CloseIcon />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
        {groups.map((g, i) => (
          <div key={g.id} className="flex flex-col gap-4">
            {i > 0 && <DropdownDivider />}
            <div className="flex flex-col gap-1">
              <DropdownSectionTitle>{g.title}</DropdownSectionTitle>
              {g.options.map((o) => (
                <CheckboxOption
                  key={o.value}
                  label={o.label}
                  checked={(draft[g.id as Group] as string[]).includes(o.value)}
                  onToggle={() => toggle(g.id as Group, o.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="flex shrink-0 items-center justify-end gap-3 p-6 shadow-[inset_0_1px_0_var(--gc-border-default)]">
        <button
          type="button"
          onClick={() => setDraft({ ...draft, device: [], visitType: [], country: [] })}
          className="flex h-control-40 items-center rounded-md px-4 text-label-default text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover"
        >
          {f.resetAll}
        </button>
        <button
          type="button"
          onClick={() => onApply(draft)}
          className="flex h-control-40 items-center rounded-md bg-bg-button-primary px-4 text-label-default font-semibold text-text-on-button-primary hover-layer"
        >
          {f.apply}
        </button>
      </footer>
    </aside>
    {/* 새 모달 (Figma 없음) — Leave setup 모달과 같은 틀: w520 p32 gap32 radius16 */}
    <Modal open={confirm !== null} onEscape={() => setConfirm(null)} labelledBy="apply-filters-title">
      <div className="flex w-[520px] flex-col gap-8 rounded-lg bg-bg-surface p-8 inset-ring inset-ring-border-default">
        <div className="flex flex-col gap-4">
          <h2 id="apply-filters-title" className="text-[20px] leading-[1.3] font-bold text-text-primary">
            {f.applyConfirm.title}
          </h2>
          <p className="text-body-default text-text-secondary">{f.applyConfirm.description}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={() => finish(false)}>
            {f.applyConfirm.discard}
          </Button>
          <Button variant="primary" onClick={() => finish(true)}>
            {f.applyConfirm.apply}
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}
