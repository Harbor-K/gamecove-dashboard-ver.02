"use client";

import { CheckSmIcon, ClockSmIcon, WarningSmIcon } from "@/components/icons-mapping";
import { AutoTextarea } from "@/components/setup/drawer";
import type { NodeFieldKey } from "@/data/types";
import { useI18n } from "@/lib/i18n";

export const fieldOrder: NodeFieldKey[] = ["about", "enter", "ends", "elements"];

export type FieldStatus = "none" | "identified" | "notIdentified" | "pending";

// Figma `Field / Review`: 라벨 14 secondary + (오른쪽) 상태 12 + 16 아이콘, 간격 8.
// 입력창 radius 8, bg canvas, 1px 테두리 (Not identified = critical, Pending = pending).
export function ReviewField({
  field,
  status,
  value,
  onChange,
}: {
  field: NodeFieldKey;
  status: FieldStatus;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const ring =
    status === "notIdentified"
      ? "inset-ring-status-critical"
      : status === "pending"
        ? "inset-ring-status-pending"
        : "inset-ring-border-default";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-default text-text-secondary">{t.nodeDetail.fields[field]}</span>
        {status === "identified" && (
          <span className="flex items-center gap-1 text-status-positive">
            <CheckSmIcon className="shrink-0" />
            <span className="text-caption-default">{t.nodeDetail.identified}</span>
          </span>
        )}
        {status === "notIdentified" && (
          <span className="flex items-center gap-1 text-status-critical">
            <WarningSmIcon className="shrink-0" />
            <span className="text-caption-default">{t.nodeDetail.notIdentified}</span>
          </span>
        )}
        {status === "pending" && (
          <span className="flex items-center gap-1 text-status-pending">
            <ClockSmIcon className="shrink-0" />
            <span className="text-caption-default">{t.nodeDetail.pending}</span>
          </span>
        )}
      </div>
      {/* 한 줄 48px: 글자 25.6 + 위아래 11.2 */}
      <div className={`rounded-md bg-bg-canvas px-3 py-[11.2px] inset-ring ${ring}`}>
        <AutoTextarea value={value} onChange={onChange} placeholder={t.nodeDetail.placeholders[field]} />
      </div>
    </div>
  );
}
