"use client";

import { useEffect, useState } from "react";
import { ArrowUpRightIcon } from "@/components/icons-mapping";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/lib/i18n";

const HINT_DELAY_MS = 3000;
const BUBBLE_FILL = "linear-gradient(var(--gc-bg-accent-strong), var(--gc-bg-accent-strong)), var(--gc-bg-surface)";

// Figma "매핑 셋업 팝업" — `Modal / Game connected` (w520 p32 gap32 radius 16) + "Just 3 steps!" 말풍선.
// - 말풍선은 팝업이 뜨고 약 3초 뒤에 나타난다.
// - 외부 링크는 hover만. Explore dashboard = 대시보드(Overview)로 이동 — 셋업 진행 상태는 그대로 남아서,
//   흐름을 끝내기 전에 Tracking으로 돌아오면 직전 저장 시점(이 팝업부터)에서 다시 시작한다.
export function GameConnectedModal({
  open,
  closing,
  onGoToMapping,
  onExploreDashboard,
}: {
  open: boolean;
  closing: boolean;
  onGoToMapping: () => void;
  onExploreDashboard: () => void;
}) {
  const { t } = useI18n();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Modal contained open={open} closing={closing} labelledBy="game-connected-title">
      <div className="relative flex w-[520px] flex-col gap-8 rounded-lg bg-bg-surface p-8 inset-ring inset-ring-border-default shadow-[0_16px_40px_0_var(--gc-effect-shadow)]">
        <div className="flex flex-col gap-4">
          <h2 id="game-connected-title" className="text-[20px] leading-[1.3] font-bold text-text-primary">
            {t.gameConnected.title}
          </h2>
          <div className="flex flex-col text-body-default text-text-secondary">
            <p>{t.gameConnected.bodyLine1}</p>
            <p className="flex items-center gap-2">
              <span>{t.gameConnected.bodyLine2}</span>
              {/* 본문 옆 링크: 14px 밑줄 + 14px ↗ (stroke 1.2), gap 4. hover만 */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="group flex items-center gap-1 text-fs-14 leading-[1.5] text-text-secondary hover:text-text-primary"
              >
                <span className="underline">{t.gameConnected.whyMapping}</span>
                <span className="flex size-[14px] items-center justify-center">
                  <ArrowUpRightIcon className="shrink-0" />
                </span>
              </a>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {/* Figma 프레임 값: 이 팝업의 버튼은 radius 8, 라벨 행간 1.6 */}
          <button
            type="button"
            onClick={onExploreDashboard}
            className="flex h-control-48 items-center rounded-md px-4 text-fs-16 leading-[1.6] text-text-primary inset-ring inset-ring-border-default cursor-pointer hover:bg-bg-hover"
          >
            {t.gameConnected.exploreDashboard}
          </button>
          <button
            type="button"
            onClick={onGoToMapping}
            className="flex h-control-48 items-center rounded-md border border-border-default bg-bg-button-primary bg-clip-padding px-[15px] text-fs-16 leading-[1.6] font-semibold text-text-on-button-primary hover-layer"
          >
            {t.gameConnected.goToMapping}
          </button>
        </div>

        {showHint && !closing && (
          // 말풍선: Figma 위치 (팝업 기준 x360 y218), 꼬리가 Go to Mapping 가운데를 가리킨다
          <div
            className="pointer-events-none absolute top-[218px] left-[360px] h-[58px] w-[119px]"
            style={{ animation: "gc-hint-in 420ms cubic-bezier(0.2,0.8,0.2,1) both", transformOrigin: "50% 0" }}
          >
            {/* 투명도 없이: surface 위에 accent-strong을 겹쳐 Figma 색 그대로, 뒤가 비치지 않음.
                SVG 선은 소수점 좌표에서 번져 보여서, 픽셀에 맞춰 그려지는 CSS 테두리로 만든다 (몸통 r8 + 45° 돌린 꼬리) */}
            <span aria-hidden className="absolute inset-x-0 top-2 bottom-0 rounded-md border border-border-accent" style={{ background: BUBBLE_FILL }} />
            <span
              aria-hidden
              className="absolute top-[2.5px] left-[53.85px] size-[11.3px] rotate-45 border-t border-l border-border-accent"
              style={{ background: BUBBLE_FILL }}
            />
            <span className="absolute top-5 left-4 text-body-default whitespace-nowrap text-text-on-accent">
              {t.gameConnected.hint}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
