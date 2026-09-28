"use client";

import { useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { CloseSmIcon } from "@/components/icons-mapping";
import { DrawerClose, DrawerFrame } from "@/components/setup/drawer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toCssPx } from "@/lib/zoom";
import { DataChip, Dot, type DotTone } from "./parts";

// Tracked 화면 조각: Figma `Chip / Count`, `Panel / Tracked events`, `Drawer / Event detail`, `Drawer / Node detail · Data`

/** Figma `Chip / Count` (Status=Pending / Tracked): h40 px16 gap8 radius 8, bg surface, 1px 테두리, 14 Regular */
export function CountChip({
  tone,
  label,
  count,
  active,
  onClick,
}: {
  tone: "pending" | "positive";
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={active}
      onClick={onClick}
      className={`flex h-control-40 items-center gap-2 rounded-md px-4 text-label-default text-text-primary inset-ring inset-ring-border-default cursor-pointer ${
        active ? "bg-bg-selected" : "bg-bg-surface hover:bg-bg-hover"
      }`}
    >
      <Dot tone={tone} />
      <span>{label}</span>
      <span>{count}</span>
    </button>
  );
}

export type PanelItem = { id: string; label: string; tone: DotTone };

/**
 * Figma `Panel / Tracked events`: w280 p8 gap4 radius 8, 그림자 0 8 24.
 * 처음 자리는 캔버스 왼쪽 아래 (툴바 오른쪽 16). 머리를 잡고 끌어 옮긴다. X로 닫기.
 */
export function EventListPanel({
  title,
  items,
  selectedId,
  onSelect,
  onClose,
}: {
  title: string;
  items: PanelItem[];
  selectedId: string | null;
  /** 없으면 항목을 눌러도 아무 일 없음 (Pending) */
  onSelect?: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [pos, setPos] = useState({ left: 80, bottom: 24 });

  const startDrag = (e: ReactPointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, ...pos };
    const move = (m: PointerEvent) =>
      setPos({
        left: Math.max(0, start.left + toCssPx(m.clientX - start.x)),
        bottom: Math.max(0, start.bottom - toCssPx(m.clientY - start.y)),
      });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      className="absolute z-30 flex w-[280px] flex-col gap-1 rounded-md bg-bg-surface p-2 inset-ring inset-ring-border-default shadow-[0_8px_24px_0_var(--gc-effect-shadow)]"
      style={{ left: pos.left, bottom: pos.bottom, animation: "gc-rise-in 240ms cubic-bezier(0.2,0.8,0.2,1) both" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div onPointerDown={startDrag} className="flex h-8 cursor-grab items-center pr-2 pl-4 active:cursor-grabbing">
        <span className="min-w-0 flex-1 truncate text-fs-12 leading-[1.5] text-text-secondary">{title}</span>
        <button
          type="button"
          aria-label={t.logging.tracked.closePanel}
          onClick={onClose}
          className="flex size-4 items-center justify-center text-icon-secondary icon-hit cursor-pointer hover:text-icon-primary"
        >
          <CloseSmIcon />
        </button>
      </div>
      {items.map((item) => (
        // Figma `Item / Tracked event`: h40 px16 gap12 radius 8. 선택·hover = color/data/select/row
        onSelect ? (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex h-control-40 w-full items-center gap-3 rounded-md px-4 text-left cursor-pointer hover:bg-data-select-row ${
              selectedId === item.id ? "bg-data-select-row" : ""
            }`}
          >
            <Dot tone={item.tone} />
            <span className="min-w-0 flex-1 truncate text-fs-14 leading-[1.5] text-text-primary">{item.label}</span>
          </button>
        ) : (
          <div key={item.id} className="flex h-control-40 w-full items-center gap-3 rounded-md px-4">
            <Dot tone={item.tone} />
            <span className="min-w-0 flex-1 truncate text-fs-14 leading-[1.5] text-text-primary">{item.label}</span>
          </div>
        )
      ))}
    </div>
  );
}

/** Figma `Toggle`: 40×24 radius 999, On = status/positive, Off = bg/selected, 손잡이 20 control/knob */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 cursor-pointer ${on ? "bg-status-positive" : "bg-bg-selected"}`}
    >
      <span
        aria-hidden
        className="absolute top-0.5 left-0.5 size-5 rounded-full bg-control-knob transition-transform duration-150"
        style={{ transform: on ? "translateX(16px)" : undefined }}
      />
    </button>
  );
}

function DrawerSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <span className="text-fs-14 leading-[1.5] text-text-primary">{label}</span>
      {children}
    </section>
  );
}

/** Figma `Drawer / Event detail`. 속성은 실제로 기록되는 값 전부(공통 속성 포함). Active를 끄면 이 이벤트 범위의 노드에서 빠진다. Delete event는 보이기만 (동작 없음) */
export function EventDetailDrawer({
  title,
  active,
  onActiveChange,
  appliedTo,
  properties,
  analyses,
  onClose,
}: {
  title: string;
  active: boolean;
  onActiveChange: (on: boolean) => void;
  appliedTo: string[];
  properties: string[];
  analyses: string[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <DrawerFrame
      header={
        <header className="flex shrink-0 flex-col gap-3 p-6 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
          <div className="flex items-center gap-4">
            <h2 className="min-w-0 flex-1 truncate text-[20px] leading-[26px] font-bold text-text-primary">{title}</h2>
            <DrawerClose label={t.logging.close} onClick={onClose} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-fs-14 leading-[1.5] text-text-secondary">{t.logging.tracked.active}</span>
            <Toggle on={active} onChange={onActiveChange} label={t.logging.tracked.active} />
          </div>
        </header>
      }
      footer={<Button variant="secondary">{t.logging.tracked.deleteEvent}</Button>}
    >
      <div className="flex flex-col gap-8 p-6">
        <DrawerSection label={t.logging.tracked.appliedTo}>
          <div className="flex flex-wrap gap-2">
            {appliedTo.map((n) => (
              <DataChip key={n}>{n}</DataChip>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection label={t.logging.tracked.propertiesRecorded}>
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => (
              <DataChip key={p}>{p}</DataChip>
            ))}
          </div>
        </DrawerSection>
        <DrawerSection label={t.logging.tracked.usedInAnalyses}>
          <div className="flex flex-col gap-4 rounded-lg bg-bg-canvas px-6 py-4 inset-ring inset-ring-border-default">
            {analyses.map((a) => (
              <span key={a} className="text-body-default text-text-primary">
                {a}
              </span>
            ))}
          </div>
        </DrawerSection>
      </div>
    </DrawerFrame>
  );
}

/** Figma `Drawer / Node detail · Data`. 탭은 Data만 동작 (Overview·Mapping은 hover만) */
export function TrackedNodeDrawer({
  title,
  events,
  onClose,
}: {
  title: string;
  events: { id: string; label: string; properties: string[]; active: boolean }[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const tabs = [
    { key: "overview", label: t.logging.tracked.tabs.overview },
    { key: "data", label: t.logging.tracked.tabs.data },
    { key: "mapping", label: t.logging.tracked.tabs.mapping },
  ];
  return (
    <DrawerFrame
      header={
        <div className="flex shrink-0 flex-col">
          <header className="flex items-center gap-4 px-6 pt-6 pb-4">
            <h2 className="min-w-0 flex-1 truncate text-[20px] leading-[26px] font-bold text-text-primary">{title}</h2>
            <DrawerClose label={t.logging.close} onClick={onClose} />
          </header>
          <div role="tablist" className="flex h-[49px] px-6 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
            {tabs.map((tab) => {
              const selected = tab.key === "data";
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`flex h-12 w-24 items-center justify-center text-fs-16 leading-[1.5] ${
                    selected
                      ? "text-text-primary shadow-[inset_0_-2px_0_var(--gc-icon-primary)]"
                      : "text-text-secondary cursor-pointer hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-6">
        <h3 className="text-fs-16 leading-[1.5] font-bold text-text-primary">{t.logging.tracked.trackedEvents}</h3>
        {events.length === 0 && <p className="text-label-default text-text-secondary">{t.logging.tracked.noEvents}</p>}
        {events.map((e) => (
          // Figma `Card / Tracked event` (Status=Active / Inactive): p12/16 gap12 radius 8, bg canvas
          <div key={e.id} className="flex items-center gap-3 rounded-md bg-bg-canvas px-4 py-3 inset-ring inset-ring-border-default">
            <Dot tone={e.active ? "positive" : "inactive"} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-fs-16 leading-[1.5] font-bold text-text-primary">{e.label}</span>
              <span className="truncate text-fs-14 leading-[1.5] text-text-secondary">
                {t.logging.listJoin(e.properties)}
              </span>
            </div>
            <span className={`text-fs-14 leading-[1.5] ${e.active ? "text-status-positive" : "text-text-secondary"}`}>
              {e.active ? t.logging.tracked.active : t.logging.tracked.inactive}
            </span>
          </div>
        ))}
      </div>
    </DrawerFrame>
  );
}
