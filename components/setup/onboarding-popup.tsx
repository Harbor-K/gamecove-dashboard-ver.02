"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ChevronUpIcon, CloseIcon, MinusIcon } from "@/components/icons-mapping";
import { Button } from "@/components/ui/button";
import type { OnboardingMedia } from "@/data/types";
import { useI18n } from "@/lib/i18n";

// Figma `Popup / Onboarding` (State = Expanded / Minimised / Loading). w360 radius 16, shadow 0 16 40.
// props: step, title, description, progress, showStep, showProgress, showBack, showMedia (CLAUDE.md)
export type OnboardingState = "expanded" | "minimised" | "loading";

function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon-secondary cursor-pointer hover:bg-bg-hover hover:text-icon-primary"
    >
      {children}
    </button>
  );
}

export function OnboardingPopup({
  state,
  step,
  totalSteps = 3,
  title,
  description,
  media,
  progress,
  showStep = true,
  showProgress = false,
  showBack = false,
  showMedia = true,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  loadingText,
  onBack,
  onMinimise,
  onRestore,
  onClose,
}: {
  state: OnboardingState;
  step: number;
  totalSteps?: number;
  title: string;
  description: string;
  media?: OnboardingMedia;
  /** "0 / 5 nodes reviewed" 같은 진행도 */
  progress?: { count: string; label: string };
  showStep?: boolean;
  showProgress?: boolean;
  showBack?: boolean;
  showMedia?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  /** 조건이 안 맞으면 누를 수 없음 (예: Step 2는 5/5 검토, Step 3는 빨간 노드 없음) */
  primaryDisabled?: boolean;
  /** Loading 상태 문구 (기본: Saving your map) */
  loadingText?: { title: string; caption: string };
  onBack?: () => void;
  onMinimise: () => void;
  onRestore: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const shell =
    "w-[360px] rounded-lg bg-bg-surface inset-ring inset-ring-border-default shadow-[0_16px_40px_0_var(--gc-effect-shadow)]";

  if (state === "minimised") {
    return (
      <div className={`${shell} py-2 pr-4 pl-6`}>
        <div className="flex h-8 items-center gap-1">
          <span className="min-w-0 flex-1 truncate text-fs-16 leading-[1.6] font-bold text-text-primary">{title}</span>
          <HeaderButton label={t.onboarding.restore} onClick={onRestore}>
            <ChevronUpIcon />
          </HeaderButton>
          <HeaderButton label={t.onboarding.close} onClick={onClose}>
            <CloseIcon />
          </HeaderButton>
        </div>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className={`${shell} pt-6 pr-4 pb-6 pl-6`} role="status" aria-live="polite">
        <div className="flex h-[242px] flex-col items-center justify-center gap-3 text-center">
          {/* Spinner: track color/border/default + arc color/text/primary */}
          <span
            aria-hidden
            className="size-8 rounded-full border-[3px] border-border-default border-t-text-primary"
            style={{ animation: "gc-spin 900ms linear infinite" }}
          />
          <div className="flex flex-col gap-1">
            <span className="text-fs-16 leading-[1.6] font-bold text-text-primary">
              {loadingText?.title ?? t.onboarding.loadingTitle}
            </span>
            <span className="text-label-default text-text-secondary">
              {loadingText?.caption ?? t.onboarding.loadingCaption}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shell} flex flex-col gap-2 pt-4 pr-4 pb-6 pl-6`}>
      <div className="flex h-8 items-center gap-1">
        <span className="min-w-0 flex-1 text-caption-default text-text-secondary">
          {showStep && t.onboarding.stepOf(step, totalSteps)}
        </span>
        <HeaderButton label={t.onboarding.minimise} onClick={onMinimise}>
          <MinusIcon />
        </HeaderButton>
        <HeaderButton label={t.onboarding.close} onClick={onClose}>
          <CloseIcon />
        </HeaderButton>
      </div>

      {showMedia && (
        <div className="pb-2">
          {/* 미디어 슬롯 320×180 radius 8. GIF는 2배 해상도(640×360)를 줄여서 보여준다 */}
          <div className="relative flex h-[180px] w-full items-center justify-center overflow-hidden rounded-md bg-bg-selected">
            {media?.src ? (
              <Image src={media.src} alt="" fill sizes="320px" unoptimized className="object-cover" />
            ) : (
              <span className="text-fs-14 leading-normal text-text-secondary">{t.onboarding.mediaPlaceholder}</span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pr-2">
        <h2 className="text-[20px] leading-[1.3] font-bold tracking-[-0.2px] text-text-primary">{title}</h2>
        <p className="text-body-default text-text-secondary">{description}</p>
      </div>

      {showProgress && progress && (
        <div className="flex items-center gap-2 pt-2">
          <span className="text-fs-16 leading-[1.6] font-bold text-text-primary">{progress.count}</span>
          <span className="text-body-default text-text-secondary">{progress.label}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {showBack && (
          <Button variant="secondary" onClick={onBack}>
            {t.onboarding.back}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="disabled:cursor-default disabled:opacity-40 disabled:after:hidden"
        >
          {primaryLabel}
        </Button>
      </div>
    </div>
  );
}
