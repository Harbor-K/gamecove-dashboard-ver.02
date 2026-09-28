"use client";

import { useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons-mapping";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";
import { DataChip } from "./parts";

// View script 공용 모달 (Figma에 없음 — 디자이너 요청으로 추가).
// (A) Step 3 observation 스크립트 / (B) Pending instrumentation 템플릿을 같은 모달에 보여준다. 둘을 섞지 않는다.
export type ScriptView = {
  title: string;
  code: string;
  /** 모달 위쪽 정보 줄 (위치 / 적용 노드·속성) */
  meta: { label: string; values: string[]; muted?: string }[];
};

export function ScriptModal({ view, onClose }: { view: ScriptView | null; onClose: () => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!view) return;
    navigator.clipboard?.writeText(view.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal contained open={view !== null} onEscape={onClose} labelledBy="script-modal-title">
      {view && (
        <div className="flex max-h-[calc(100vh/var(--gc-zoom)-80px)] w-[640px] flex-col gap-6 rounded-lg bg-bg-surface p-8 inset-ring inset-ring-border-default shadow-[0_16px_40px_0_var(--gc-effect-shadow)]">
          <div className="flex items-center gap-4">
            <h2 id="script-modal-title" className="min-w-0 flex-1 truncate text-[20px] leading-[1.3] font-bold text-text-primary">
              {view.title}
            </h2>
            <button
              type="button"
              aria-label={t.logging.script.close}
              onClick={onClose}
              className="flex size-5 shrink-0 items-center justify-center text-icon-secondary icon-hit cursor-pointer hover:text-icon-primary"
            >
              <CloseIcon />
            </button>
          </div>

          {view.meta.map((m) => (
            <MetaRow key={m.label} label={m.label}>
              {m.values.map((v) => (
                <DataChip key={v}>{v}</DataChip>
              ))}
              {m.muted && <DataChip muted>{m.muted}</DataChip>}
            </MetaRow>
          ))}

          <pre className="min-h-0 flex-1 overflow-auto rounded-md bg-bg-canvas p-4 font-mono text-fs-14 leading-[1.6] text-text-primary inset-ring inset-ring-border-default">
            <code>{view.code}</code>
          </pre>

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={copy}>
              {copied ? t.logging.script.copied : t.logging.script.copy}
            </Button>
            <Button variant="primary" onClick={onClose}>
              {t.logging.script.close}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label-default text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
