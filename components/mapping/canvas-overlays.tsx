"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AddPlusIcon,
  ArrowheadIcon,
  ChevronDownSmIcon,
  CurveIcon,
  EditIcon,
  FitIcon,
  LineStyleIcon,
  RedoIcon,
  StrokeWeightIcon,
  TextIcon,
  TrashIcon,
  UndoIcon,
  UngroupIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/icons-mapping";
import { Button } from "@/components/ui/button";
import type { NodeIconKey } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { useDismiss } from "@/lib/use-dismiss";
import { iconOptions, nodeIcons } from "./canvas-node";

const menuPanel =
  "flex flex-col gap-1 rounded-md bg-bg-surface p-2 inset-ring inset-ring-border-default shadow-[0_8px_24px_0_var(--gc-effect-shadow)]";

// ── Canvas toolbar (왼쪽 아래): Figma `Canvas / Control` 40×40 radius 8, hover color/bg/hover ──────────
function ControlButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-10 items-center justify-center rounded-md text-icon-secondary cursor-pointer hover:bg-bg-hover hover:text-icon-primary disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-icon-secondary"
    >
      <span className="flex size-5 items-center justify-center">{children}</span>
    </button>
  );
}

export function CanvasControls({
  onZoomIn,
  onZoomOut,
  onFit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  const { t } = useI18n();
  const group = "flex flex-col overflow-hidden rounded-md bg-bg-surface inset-ring inset-ring-border-default";
  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-col items-start gap-3" onPointerDown={(e) => e.stopPropagation()}>
      <div className={group}>
        <ControlButton label={t.canvas.zoomIn} onClick={onZoomIn}>
          <ZoomInIcon className="shrink-0" />
        </ControlButton>
        <ControlButton label={t.canvas.zoomOut} onClick={onZoomOut}>
          <ZoomOutIcon />
        </ControlButton>
        <ControlButton label={t.canvas.fit} onClick={onFit}>
          <FitIcon />
        </ControlButton>
      </div>
      <div className={group}>
        <ControlButton label={t.canvas.undo} onClick={onUndo} disabled={!canUndo}>
          <UndoIcon />
        </ControlButton>
        <ControlButton label={t.canvas.redo} onClick={onRedo} disabled={!canRedo}>
          <RedoIcon />
        </ControlButton>
      </div>
    </div>
  );
}

// ── Add (오른쪽 위): Figma `Button / Add` + `Menu / Add` (Type=Node) ─────────────────────────────
// 메뉴는 버튼 아래 8px, 오른쪽 맞춤.
// Figma `Menu / Add` Type=Node / Node + Logging. Add logging은 눌러도 아무 일 없음 (디자이너 요청)
export function AddNodeButton({ onAddNode, onAddLogging }: { onAddNode: () => void; onAddLogging?: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex h-control-40 items-center gap-2 rounded-md pr-4 pl-3 inset-ring inset-ring-border-default cursor-pointer ${
          open ? "bg-bg-selected" : "bg-bg-surface hover:bg-bg-hover"
        }`}
      >
        <span className="flex size-4 items-center justify-center text-icon-primary">
          <AddPlusIcon className="shrink-0" />
        </span>
        <span className="text-body-default text-text-primary">{t.canvas.add}</span>
      </button>
      {open && (
        <div role="menu" className={`absolute top-[calc(100%+8px)] right-0 w-40 ${menuPanel}`}>
          <MenuItem
            label={t.canvas.addNode}
            onClick={() => {
              setOpen(false);
              onAddNode();
            }}
          />
          {onAddLogging && (
            <MenuItem
              label={t.logging.tracked.addLogging}
              onClick={() => {
                setOpen(false);
                onAddLogging();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Figma `Menu / Item`: h40 px8 gap8 radius 8. hover = color/bg/hover, Critical hover = color/bg/critical-hover
function MenuItem({
  label,
  icon,
  critical = false,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  critical?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`group flex h-control-40 w-full shrink-0 items-center gap-2 rounded-md px-2 text-left cursor-pointer ${
        critical ? "text-status-critical hover:bg-bg-critical-hover" : "text-text-primary hover:bg-bg-hover"
      }`}
    >
      {icon && (
        <span
          className={`flex size-5 shrink-0 items-center justify-center ${
            critical ? "text-status-critical" : "text-icon-secondary group-hover:text-icon-primary"
          }`}
        >
          {icon}
        </span>
      )}
      <span className="text-body-default whitespace-nowrap">{label}</span>
    </button>
  );
}

// ── 노드 우클릭 메뉴: Figma `Menu / Node actions` (In group=True면 Ungroup 추가) ───────────────────
export function NodeActionsMenu({
  x,
  y,
  inGroup,
  onUngroup,
  onEdit,
  onDelete,
  onClose,
}: {
  x: number;
  y: number;
  inGroup: boolean;
  onUngroup: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, true, onClose);
  const run = (fn: () => void) => () => {
    onClose();
    fn();
  };
  return (
    <div
      ref={ref}
      role="menu"
      className={`absolute z-30 w-[200px] ${menuPanel}`}
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {inGroup && <MenuItem label={t.canvas.ungroup} icon={<UngroupIcon />} onClick={run(onUngroup)} />}
      <MenuItem label={t.canvas.edit} icon={<EditIcon />} onClick={run(onEdit)} />
      <MenuItem label={t.canvas.delete} icon={<TrashIcon />} critical onClick={run(onDelete)} />
    </div>
  );
}

// ── 연결선 툴바: Figma `Toolbar / Connector` (p4 gap4 radius 16). 버튼은 hover만, 동작 없음 ────────────
function ToolbarButton({ label, icon, chevron = true }: { label: string; icon: ReactNode; chevron?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`group flex h-control-40 shrink-0 items-center gap-1 rounded-md px-2 cursor-pointer hover:bg-bg-hover ${chevron ? "w-[60px]" : "w-10 justify-center"}`}
    >
      <span className="flex size-6 items-center justify-center text-icon-secondary group-hover:text-icon-primary">{icon}</span>
      {chevron && (
        <span className="flex size-4 items-center justify-center text-icon-secondary">
          <ChevronDownSmIcon />
        </span>
      )}
    </button>
  );
}

const ToolbarDivider = () => <span aria-hidden className="h-6 w-px shrink-0 bg-border-default" />;

export function ConnectorToolbar({ x, y }: { x: number; y: number }) {
  const { t } = useI18n();
  const l = t.canvas.connectorToolbar;
  return (
    <div
      className="absolute z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-bg-surface p-1 inset-ring inset-ring-border-default shadow-[0_8px_24px_0_var(--gc-effect-shadow)]"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ToolbarButton
        label={l.color}
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
            <circle cx="10" cy="10" r="9.5" fill="var(--gc-icon-secondary)" stroke="var(--gc-border-default)" />
          </svg>
        }
      />
      <ToolbarDivider />
      <ToolbarButton label={l.strokeWeight} icon={<StrokeWeightIcon />} />
      <ToolbarButton label={l.addText} icon={<TextIcon />} chevron={false} />
      <ToolbarDivider />
      <ToolbarButton label={l.lineStyle} icon={<LineStyleIcon />} />
      <ToolbarButton label={l.lineType} icon={<CurveIcon />} />
      <ToolbarButton label={l.arrowhead} icon={<ArrowheadIcon />} />
    </div>
  );
}

// ── Edit node 팝오버: Figma `Popover / Edit node` (w360 p24 gap16 radius 16) ──────────────────────
export type NodeDraft = { title: string; role: string; icon: NodeIconKey };

export function EditNodePopover({
  x,
  y,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  x: number;
  y: number;
  draft: NodeDraft;
  onChange: (draft: NodeDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter") onSave();
  };

  return (
    <div
      role="dialog"
      aria-label={t.canvas.editNode}
      className="absolute z-30 flex w-[360px] flex-col gap-4 rounded-lg bg-bg-surface p-6 inset-ring inset-ring-border-default shadow-[0_8px_24px_0_var(--gc-effect-shadow)]"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      <h3 className="text-fs-16 leading-[1.6] font-bold text-text-primary">{t.canvas.editNode}</h3>
      <div className="flex flex-col gap-2">
        <span className="text-label-default text-text-secondary">{t.canvas.icon}</span>
        <div className="flex gap-2">
          {iconOptions.map((key) => {
            const Icon = nodeIcons[key];
            const selected = draft.icon === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ ...draft, icon: key })}
                className={`group flex size-8 items-center justify-center rounded-md inset-ring inset-ring-border-default cursor-pointer ${
                  selected ? "bg-bg-selected text-icon-primary" : "bg-bg-canvas text-icon-secondary hover:bg-bg-hover hover:text-icon-primary"
                }`}
              >
                <Icon className="shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
      <Field label={t.canvas.name} inputRef={nameRef} value={draft.title} onChange={(title) => onChange({ ...draft, title })} />
      <Field label={t.canvas.role} value={draft.role} onChange={(role) => onChange({ ...draft, role })} />
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          {t.canvas.cancel}
        </Button>
        <Button variant="primary" onClick={onSave}>
          {t.canvas.save}
        </Button>
      </div>
    </div>
  );
}

// Figma `Input`: label 14 secondary, gap8, field h48 px12 radius 8 bg canvas. Focused 상태도 테두리 변화 없음.
function Field({
  label,
  value,
  onChange,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-label-default text-text-secondary">{label}</span>
      <span className="flex h-control-48 items-center rounded-md bg-bg-canvas px-3 inset-ring inset-ring-border-default">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-body-default text-text-primary caret-text-primary outline-none focus-visible:outline-none"
        />
      </span>
    </label>
  );
}
