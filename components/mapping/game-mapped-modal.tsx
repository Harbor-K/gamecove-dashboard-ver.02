"use client";

import { ArrowUpRightIcon } from "@/components/icons-mapping";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";

// Figma `Modal / Game mapped` (w480 p32 gap32 radius 16).
// Not now = 0 tracked 화면, Set up logging = Logging setup Step 1. 링크는 hover만.
export function GameMappedModal({
  open,
  onNotNow,
  onSetUpLogging,
}: {
  open: boolean;
  onNotNow: () => void;
  onSetUpLogging: () => void;
}) {
  const { t } = useI18n();
  return (
    <Modal contained open={open} onEscape={onNotNow} labelledBy="game-mapped-title">
      <div className="flex w-[480px] flex-col gap-8 rounded-lg bg-bg-surface p-8 inset-ring inset-ring-border-default shadow-[0_16px_40px_0_var(--gc-effect-shadow)]">
        <div className="flex flex-col gap-4">
          <h2 id="game-mapped-title" className="text-[20px] leading-[1.3] font-bold text-text-primary">
            {t.gameMapped.title}
            <br />
            {t.gameMapped.subtitle}
          </h2>
          <div className="flex flex-col text-body-default text-text-secondary">
            <p>{t.gameMapped.bodyLine1}</p>
            <p className="flex flex-wrap items-center gap-x-2">
              <span>{t.gameMapped.bodyLine2}</span>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1 text-fs-14 leading-[1.5] text-text-secondary hover:text-text-primary"
              >
                <span className="underline">{t.gameMapped.link}</span>
                <span className="flex size-[14px] items-center justify-center">
                  <ArrowUpRightIcon className="shrink-0" />
                </span>
              </a>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          {/* Figma 프레임 값: 이 모달의 버튼은 radius 8, 라벨 행간 1.6 */}
          <button
            type="button"
            onClick={onNotNow}
            className="flex h-control-48 items-center rounded-md px-4 text-fs-16 leading-[1.6] text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover"
          >
            {t.gameMapped.notNow}
          </button>
          <button
            type="button"
            onClick={onSetUpLogging}
            className="flex h-control-48 items-center rounded-md border border-border-default bg-bg-button-primary bg-clip-padding px-[15px] text-fs-16 leading-[1.6] font-semibold text-text-on-button-primary hover-layer"
          >
            {t.gameMapped.setUpLogging}
          </button>
        </div>
      </div>
    </Modal>
  );
}
