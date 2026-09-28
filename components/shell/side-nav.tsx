"use client";

import type { ReactNode } from "react";
import { NavOpenIcon } from "@/components/icons";
import type { User } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./logo";
import { ProfileCard } from "./profile-card";

// Figma `workspace 네비게이션 ver.2` / `Project navigation` 공통 틀: w280, bg nav, border-right, px16, gap16.
// 로고 줄과 프로필 카드 사이 내용(children)은 워크스페이스/프로젝트 내비가 채운다.
// 내비 전체는 스크롤하지 않는다 — 긴 목록은 각 내비가 가운데만 스크롤(스크롤바 없음).
export function SideNav({
  user,
  visible,
  pinned,
  onToggle,
  onMouseLeave,
  children,
}: {
  user: User;
  visible: boolean;
  /** 고정(열림) 상태. false면 가장자리 hover로 잠깐 열린 상태 */
  pinned: boolean;
  onToggle: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <nav
      inert={!visible}
      onMouseLeave={onMouseLeave}
      className={`fixed top-0 left-0 z-30 flex h-[calc(100vh/var(--gc-zoom))] w-sidebar flex-col gap-4 overflow-hidden bg-bg-nav px-4 shadow-[inset_-1px_0_0_var(--gc-border-default)] transition-transform duration-200 ease-out ${
        visible ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex w-full shrink-0 items-center justify-between py-2">
        <Logo />
        <button
          type="button"
          aria-label={pinned ? t.nav.collapse : t.nav.expand}
          onClick={onToggle}
          className="block text-icon-primary icon-hit"
        >
          <NavOpenIcon />
        </button>
      </div>
      {children}
      <ProfileCard user={user} />
    </nav>
  );
}
