"use client";

import Image from "next/image";
import { DirectionIcon } from "@/components/icons";
import type { User } from "@/data/types";
import { useI18n } from "@/lib/i18n";

// Figma `프로필카드`: h71, border-top, px8, gap12. 아바타는 원형 유지.
export function ProfileCard({ user }: { user: User }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-label={t.nav.profileMenu}
      className="flex h-[71px] w-full shrink-0 items-center gap-3 px-2 shadow-[inset_0_1px_0_var(--gc-border-default)] text-left cursor-pointer hover:bg-bg-hover"
    >
      <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-avatar-violet">
        <Image src={user.avatar} alt="" fill sizes="32px" className="object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-label-default font-bold text-text-primary">{user.name}</span>
        <span className="truncate text-caption-default text-text-secondary">{t.role[user.role]}</span>
      </span>
      <DirectionIcon className="shrink-0 text-icon-primary" />
    </button>
  );
}
