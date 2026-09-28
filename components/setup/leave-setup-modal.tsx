"use client";

import { WarningIcon } from "@/components/icons-mapping";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";

// Figma `Modal / Leave setup` (Type=Mapping / Logging): w520, p32, gap32, radius 16.
// Leave: onLeave가 없으면 hover만 (매핑 셋업, 디자이너 요청). 로깅 셋업은 0 tracked 화면으로. Continue / Esc = 모달 닫기.
export function LeaveSetupModal({
  open,
  type,
  onContinue,
  onLeave,
}: {
  open: boolean;
  type: "mapping" | "logging";
  onContinue: () => void;
  onLeave?: () => void;
}) {
  const { t } = useI18n();
  const title = type === "mapping" ? t.leaveSetup.mappingTitle : t.leaveSetup.loggingTitle;
  const description = type === "mapping" ? t.leaveSetup.mappingDescription : t.leaveSetup.loggingDescription;

  return (
    <Modal open={open} onEscape={onContinue} labelledBy="leave-setup-title">
      <div className="flex w-[520px] flex-col gap-8 rounded-lg bg-bg-surface p-8 inset-ring inset-ring-border-default">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <WarningIcon className="shrink-0 text-status-critical" />
            <h2 id="leave-setup-title" className="text-[20px] leading-[1.3] font-bold text-text-primary">
              {title}
            </h2>
          </div>
          <p className="text-body-default text-text-secondary">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onLeave}>
            {t.leaveSetup.leave}
          </Button>
          <Button variant="primary" onClick={onContinue}>
            {t.leaveSetup.continue}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
