"use client";

import Image from "next/image";
import { ChevronIcon, HelpIcon, NavClosedIcon, NotificationIcon, SparkIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import { LogoMark } from "./logo";
import { ThemeMenu } from "./theme-menu";

export type TopBarSelect = {
  name: string;
  thumbnail: string;
  /** 스튜디오 썸네일은 chart/bar/emphasis 배경 위에 얹는다 (Figma). 프로젝트 썸네일은 배경 없음. */
  thumbnailBackdrop: boolean;
  ariaLabel: string;
};

// Figma `워크스페이스 상단바` / `프로젝트 상단바`: h56, border-bottom, px16, gap16.
export function TopBar({
  select,
  navCollapsed,
  onExpandNav,
  onAiAgent,
}: {
  select: TopBarSelect;
  navCollapsed: boolean;
  onExpandNav: () => void;
  /** AI Agent 패널 열기/닫기. 없으면 hover만 (워크스페이스·셋업 중) */
  onAiAgent?: () => void;
}) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center gap-4 bg-bg-canvas px-4 shadow-[inset_0_-1px_0_var(--gc-border-default)]">
      {navCollapsed && (
        // 내비가 닫혀 있으면 왼쪽 위에 캐릭터만 남고, hover 시 내비 아이콘으로 바뀐다. 누르면 내비 고정.
        <button
          type="button"
          aria-label={t.nav.expand}
          onClick={onExpandNav}
          className="group flex size-10 shrink-0 items-center justify-center cursor-pointer text-icon-primary"
        >
          <span className="group-hover:hidden">
            <LogoMark />
          </span>
          <NavClosedIcon className="hidden group-hover:block" />
        </button>
      )}

      {/* Top bar / Select: w236 h40 px12 radius 8. hover = color/bg/hover */}
      <button
        type="button"
        aria-label={select.ariaLabel}
        className="group flex h-control-40 w-[236px] shrink-0 items-center justify-between rounded-md inset-ring inset-ring-border-default bg-bg-surface px-3 cursor-pointer hover:bg-bg-hover"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`relative size-6 shrink-0 overflow-hidden rounded-sm ${select.thumbnailBackdrop ? "bg-chart-bar-emphasis" : ""}`}
          >
            <Image src={select.thumbnail} alt="" fill sizes="24px" className="object-cover" />
          </span>
          <span className="truncate text-body-default text-text-primary">{select.name}</span>
        </span>
        <span className="flex h-[5px] w-[10px] shrink-0 items-center justify-center text-icon-secondary group-hover:text-icon-primary">
          <ChevronIcon className="shrink-0" />
        </span>
      </button>

      <div className="h-px min-w-px flex-1" />

      <div className="flex shrink-0 items-center gap-6">
        {/* AI agent: hover = color/bg/hover, 선택 색 없음 */}
        <button
          type="button"
          onClick={onAiAgent}
          className="flex h-control-40 items-center gap-2 rounded-full inset-ring inset-ring-border-accent bg-bg-surface px-4 cursor-pointer hover:bg-bg-hover"
        >
          <SparkIcon className="shrink-0 text-icon-ai" />
          <span className="text-fs-14 leading-normal whitespace-nowrap text-text-primary">{t.topBar.aiAgent}</span>
        </button>
        <div className="flex items-center gap-6">
          <button type="button" aria-label={t.topBar.notifications} className="block size-6 text-icon-primary icon-hit">
            <NotificationIcon />
          </button>
          <button type="button" aria-label={t.topBar.help} className="block size-6 text-icon-primary icon-hit">
            <HelpIcon />
          </button>
          <ThemeMenu />
        </div>
      </div>
    </header>
  );
}
