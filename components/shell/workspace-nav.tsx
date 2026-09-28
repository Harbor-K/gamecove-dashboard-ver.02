"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DataIcon, HomeIcon, PaperIcon, PeopleIcon, SettingsIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages";
import { NavItem } from "./nav-item";
import { SettingsNavItem } from "./settings-nav-item";

type NavEntry = {
  key: keyof Messages["nav"];
  icon: ReactNode;
  /** 없으면 화면 미구현 (hover만) */
  href?: string;
};

const studioGroup: NavEntry[] = [
  { key: "studioMembers", icon: <PeopleIcon />, href: "/studio-members" },
  { key: "reports", icon: <PaperIcon /> },
  { key: "dataSources", icon: <DataIcon /> },
];

const workspaceGroup: NavEntry[] = [
  { key: "workspace", icon: <HomeIcon />, href: "/" },
  { key: "setting", icon: <SettingsIcon /> },
];

// 워크스페이스 내비(Figma 프레임): 위쪽 Studio 그룹 글자는 primary, 아래 Workspace 그룹은 컴포넌트 기본(secondary).
export function WorkspaceNav() {
  const { t, href } = useI18n();
  const pathname = usePathname();

  const renderGroup = (entries: NavEntry[], labelTone: "primary" | "secondary") => (
    <div className="flex w-full shrink-0 flex-col gap-1">
      {entries.map((entry) =>
        entry.key === "setting" ? (
          <SettingsNavItem key={entry.key} labelTone={labelTone} />
        ) : (
        <NavItem
          key={entry.key}
          icon={entry.icon}
          label={t.nav[entry.key]}
          href={entry.href && href(entry.href)}
          selected={entry.href === pathname}
          labelTone={labelTone}
        />
        ),
      )}
    </div>
  );

  return (
    <>
      {renderGroup(studioGroup, "primary")}
      <div className="min-h-px flex-1" />
      {renderGroup(workspaceGroup, "secondary")}
    </>
  );
}
