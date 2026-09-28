"use client";

import { useState, type ReactNode } from "react";
import { AutoTextarea, Drawer } from "@/components/setup/drawer";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { NodeDetails, NodeFieldKey, NodeMappingStatus, ScriptReview } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { nodeIcons } from "./canvas-node";
import type { NodeInfo } from "./mapping-canvas";
import { fieldOrder, ReviewField, type FieldStatus } from "./node-fields";

export type Resolution =
  | { kind: "candidate"; name: string }
  | { kind: "neither"; description: string }
  | { kind: "pending" }
  | null;

// Step 3 — Figma `Drawer / Review node`.
// Step 2에서 적은 구조를 보여주고, 항목마다 스크립트와 맞춰 본 결과(Identified / Not identified / Pending)를 표시한다.
// 확인 안 된 항목 아래 `Resolve card`: AI 후보 + Neither(자연어 입력) + Not sure? Leave this pending.
// 수정 내용은 Save를 눌러야 확정. Reset = Step 3에 처음 들어왔을 때 상태로.
export function ReviewDrawer({
  node,
  details,
  initialDetails,
  status,
  initialStatus,
  review,
  onSave,
  onClose,
}: {
  node: NodeInfo;
  /** 지금 저장된 내용 */
  details: NodeDetails;
  /** Step 3 처음 상태 (Reset) */
  initialDetails: NodeDetails;
  status: NodeMappingStatus;
  initialStatus: NodeMappingStatus;
  /** 스크립트와 맞추지 못한 항목 (없으면 모두 Identified) */
  review?: ScriptReview;
  /** needsCheck = 확인 안 된 항목을 이번에 해결함 → 3초 확인 후 초록/주황 */
  onSave: (details: NodeDetails, resolution: Resolution, needsCheck: boolean) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const Icon = nodeIcons[node.icon];
  const [draft, setDraft] = useState(details);
  const [resolution, setResolution] = useState<Resolution>(null);
  const [unresolved, setUnresolved] = useState(status === "requiresReview");
  const shownStatus: NodeMappingStatus = unresolved ? "requiresReview" : status;

  const fieldStatus = (key: NodeFieldKey): FieldStatus => {
    if (review?.field !== key) return "identified";
    if (shownStatus === "requiresReview" || shownStatus === "checking") return "notIdentified";
    return shownStatus === "pending" ? "pending" : "identified";
  };
  const showResolve = review && unresolved;
  const canSave =
    !showResolve ||
    resolution?.kind === "candidate" ||
    resolution?.kind === "pending" ||
    (resolution?.kind === "neither" && resolution.description.trim().length > 0);

  const reset = () => {
    setDraft(initialDetails);
    setResolution(null);
    setUnresolved(initialStatus === "requiresReview");
  };

  return (
    <Drawer
      icon={<Icon />}
      title={node.title}
      closeLabel={t.nodeDetail.close}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={reset}>
            {t.nodeDetail.reset}
          </Button>
          <Button variant="primary" onClick={() => onSave(draft, resolution, !!showResolve)} disabled={!canSave}>
            {t.nodeDetail.save}
          </Button>
        </>
      }
    >
      {fieldOrder.map((key) => (
        <div key={key} className="flex flex-col gap-6">
          <ReviewField
            field={key}
            status={fieldStatus(key)}
            value={draft[key].value}
            onChange={(value) => setDraft({ ...draft, [key]: { ...draft[key], value } })}
          />
          {showResolve && review.field === key && (
            <ResolveCard candidates={review.candidates} resolution={resolution} onResolve={setResolution} />
          )}
        </div>
      ))}
    </Drawer>
  );
}

/** Figma `Radio option`의 20px 원: 기본 1.5 테두리 / 선택 = primary 원 + 가운데 8px */
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0" aria-hidden>
      {selected ? (
        <>
          <circle cx="10" cy="10" r="10" fill="var(--gc-text-primary)" />
          <circle cx="10" cy="10" r="4" fill="var(--gc-bg-canvas)" />
        </>
      ) : (
        <circle cx="10" cy="10" r="9.25" fill="none" stroke="var(--gc-border-default)" strokeWidth="1.5" />
      )}
    </svg>
  );
}

// Figma `Resolve card`: bg canvas, 1px critical, radius 16, p24, gap16.
// 후보 / Neither / Leave this pending은 한 묶음이라 하나만 선택된다.
function ResolveCard({
  candidates,
  resolution,
  onResolve,
}: {
  candidates: string[];
  resolution: Resolution;
  onResolve: (r: Resolution) => void;
}) {
  const { t } = useI18n();
  const neither = resolution?.kind === "neither";
  const pending = resolution?.kind === "pending";
  const options: { key: string; label: string; selected: boolean; pick: Resolution }[] = [
    ...candidates.map((name) => ({
      key: name,
      label: name,
      selected: resolution?.kind === "candidate" && resolution.name === name,
      pick: { kind: "candidate", name } as Resolution,
    })),
    {
      key: "__neither",
      label: t.nodeDetail.neither,
      selected: neither,
      pick: { kind: "neither", description: resolution?.kind === "neither" ? resolution.description : "" },
    },
  ];

  return (
    <div role="radiogroup" className="flex flex-col gap-4 rounded-lg bg-bg-canvas p-6 inset-ring inset-ring-status-critical">
      <h3 className="text-fs-16 leading-[1.6] font-bold text-text-primary">{t.nodeDetail.endPointQuestion}</h3>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <RadioRow key={o.key} selected={o.selected} onSelect={() => onResolve(o.pick)}>
            <span className="text-body-default">{o.label}</span>
          </RadioRow>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-label-default text-text-secondary">{t.nodeDetail.notSure}</span>
        {/* 카드 대신 같은 동그라미 선택 아이콘 (디자이너 요청). 위치는 Figma 그대로 */}
        <button
          type="button"
          role="radio"
          aria-checked={pending}
          onClick={() => onResolve({ kind: "pending" })}
          className={`flex h-8 items-center gap-2 cursor-pointer ${pending ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
        >
          <RadioDot selected={pending} />
          <span className="text-label-default">{t.nodeDetail.leavePending}</span>
        </button>
      </div>

      {neither && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-label-default text-text-secondary">{t.nodeDetail.howDoesPlayEnd}</span>
            <InfoTooltip text={t.nodeDetail.describeTooltip} />
          </div>
          {/* Figma Textarea: 최소 96px, p12, bg surface, radius 8. 내용에 맞춰 늘어난다 */}
          <div className="min-h-24 rounded-md bg-bg-surface p-3 inset-ring inset-ring-border-default">
            <AutoTextarea
              value={resolution?.kind === "neither" ? resolution.description : ""}
              onChange={(description) => onResolve({ kind: "neither", description })}
              minRows={3}
              autoFocus
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Figma `Radio option`: h48 px16 gap12 radius 8, bg surface, 1px 테두리. 선택 = 글자 primary
function RadioRow({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex h-control-48 items-center gap-3 rounded-md bg-bg-surface px-4 text-left inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover ${
        selected ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
      }`}
    >
      <RadioDot selected={selected} />
      {children}
    </button>
  );
}

