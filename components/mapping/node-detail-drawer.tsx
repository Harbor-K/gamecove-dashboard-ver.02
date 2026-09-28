"use client";

import { CheckboxIcon } from "@/components/icons-mapping";
import { Drawer } from "@/components/setup/drawer";
import { Button } from "@/components/ui/button";
import type { NodeDetails, NodeFieldKey } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { nodeIcons } from "./canvas-node";
import type { NodeInfo } from "./mapping-canvas";
import { fieldOrder, ReviewField } from "./node-fields";

// Step 2 — Figma `Drawer / Node detail`.
// AI가 읽은 내용이 입력창에 미리 들어 있고, 못 읽은 항목은 Not identified + 빈 입력창.
// "Apply this to other nodes?"에서 체크한 노드는 캔버스에서도 선택 표시, Save 시 같은 내용이 적용된다.
export function NodeDetailDrawer({
  node,
  draft,
  onChange,
  otherNodes,
  checkedIds,
  onToggleOther,
  onReset,
  onSave,
  onClose,
}: {
  node: NodeInfo;
  draft: NodeDetails;
  onChange: (draft: NodeDetails) => void;
  otherNodes: NodeInfo[];
  checkedIds: string[];
  onToggleOther: (id: string) => void;
  /** AI가 처음 채운 상태로 되돌리기 (Save 전까지는 확정 아님) */
  onReset: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const Icon = nodeIcons[node.icon];
  const setField = (key: NodeFieldKey, value: string) => onChange({ ...draft, [key]: { ...draft[key], value } });
  // AI가 못 읽은(Not identified) 항목을 채워야 저장할 수 있다
  const canSave = fieldOrder.every((key) => draft[key].identified || draft[key].value.trim().length > 0);

  return (
    <Drawer
      icon={<Icon />}
      title={node.title}
      closeLabel={t.nodeDetail.close}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onReset}>
            {t.nodeDetail.reset}
          </Button>
          <Button variant="primary" onClick={onSave} disabled={!canSave}>
            {t.nodeDetail.save}
          </Button>
        </>
      }
    >
      {fieldOrder.map((key) => (
        <ReviewField
          key={key}
          field={key}
          status={draft[key].identified ? "none" : "notIdentified"}
          value={draft[key].value}
          onChange={(v) => setField(key, v)}
        />
      ))}

      {otherNodes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-label-default text-text-secondary">{t.nodeDetail.applyToOthers}</span>
          {/* Figma `Dropdown / Checkbox option`: h40 px8 gap8 radius 8. 많아지면 다음 줄로 */}
          <div className="flex flex-wrap gap-2">
            {otherNodes.map((n) => {
              const checked = checkedIds.includes(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onToggleOther(n.id)}
                  className={`group flex h-control-40 items-center gap-2 rounded-md px-2 cursor-pointer hover:bg-bg-hover ${
                    checked ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {/* Figma: 체크박스 아이콘은 체크 여부와 상관없이 primary, 라벨만 checked=primary / unchecked=secondary */}
                  <span className="text-icon-primary">
                    <CheckboxIcon checked={checked} className="shrink-0" />
                  </span>
                  <span className="text-body-default whitespace-nowrap">{n.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Drawer>
  );
}
