"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HomeIcon, PeopleIcon } from "@/components/icons";
import {
  AddPlusIcon,
  ChevronDownSmIcon,
  ChevronRightSmIcon,
  CompassIcon,
  GamepadIcon,
  GridSmIcon,
  LineChartIcon,
  MessageIcon,
  RadioIcon,
  RepeatIcon,
} from "@/components/icons-mapping";
import { useI18n } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/messages";
import { NavItem } from "./nav-item";
import { useNavGuard } from "./nav-guard";
import { SettingsNavItem } from "./settings-nav-item";

type Key = keyof Messages["projectNav"];

const analyticsChildren: { key: Key; icon: ReactNode }[] = [
  { key: "overview", icon: <GridSmIcon /> },
  { key: "engagement", icon: <LineChartIcon /> },
  { key: "retention", icon: <RepeatIcon /> },
  { key: "experience", icon: <GamepadIcon /> },
  { key: "liveOps", icon: <RadioIcon /> },
  { key: "feedback", icon: <MessageIcon /> },
  { key: "explore", icon: <CompassIcon /> },
];

// Figma `Project navigation` (Analytics / Custom Board 펼침·접힘).
// 섹션 펼침·접힘은 자유롭게 되고, 다른 화면으로 가는 항목은 NavGuard를 거친다 (셋업 중이면 Leave setup 모달).
// 대시보드 화면이 생기기 전까지 이동할 곳이 없는 항목은 guard만 거치고 아무 일도 없다.
/** 화면이 있는 항목 → 경로 (/projects/[id]/…) */
export const projectRoutes: Partial<Record<Key, string>> = {
  overview: "overview",
  engagement: "engagement",
  retention: "retention",
  experience: "experience",
  explore: "explore",
  tracking: "tracking",
};

export function ProjectNav({
  projectId,
  selected,
  analyticsOpen,
  onAnalyticsOpenChange,
  onProjectMembers,
  onAddBoard,
}: {
  projectId: string;
  selected: Key | null;
  /** Project members 팝오버 열기 (기준 요소) */
  onProjectMembers: (anchor: HTMLElement) => void;
  onAddBoard: () => void;
  analyticsOpen: boolean;
  onAnalyticsOpenChange: (open: boolean) => void;
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const { guard } = useNavGuard();
  const [customBoardOpen, setCustomBoardOpen] = useState(false);

  // 내비로 갈 수 있는 화면을 미리 받아 둔다 → 누르면 바로 바뀐다
  useEffect(() => {
    for (const route of Object.values(projectRoutes)) router.prefetch(href(`/projects/${projectId}/${route}`));
    router.prefetch(href("/"));
  }, [router, href, projectId]);

  const chevron = (open: boolean) => (open ? <ChevronDownSmIcon /> : <ChevronRightSmIcon />);
  const item = (key: Key, icon?: ReactNode, level: "top" | "child" = "top") => (
    <NavItem
      key={key}
      icon={icon}
      label={t.projectNav[key]}
      level={level}
      selected={selected === key}
      onClick={() => {
        if (selected === key) return;
        if (key === "addBoard") return onAddBoard();
        const route = projectRoutes[key];
        guard(route ? () => router.push(href(`/projects/${projectId}/${route}`)) : undefined);
      }}
    />
  );

  return (
    <>
      <NavItem
        icon={<PeopleIcon />}
        label={t.projectNav.projectMembers}
        onClick={(e) => onProjectMembers(e.currentTarget)}
      />

      {/* Analytics ~ Tracking만 스크롤 (스크롤바 없음). 위 Project members, 아래 Workspace~프로필은 고정 */}
      <div className="scrollbar-none -mx-4 flex min-h-0 scroll-smooth w-[calc(100%+32px)] flex-1 flex-col gap-1 overflow-y-auto px-4 pt-4">
        <NavItem
          label={t.projectNav.analytics}
          trailing={chevron(analyticsOpen)}
          ariaExpanded={analyticsOpen}
          onClick={() => onAnalyticsOpenChange(!analyticsOpen)}
        />
        {analyticsOpen && (
          <Reveal className="flex w-full flex-col gap-1">{analyticsChildren.map((c) => item(c.key, c.icon, "child"))}</Reveal>
        )}
        <NavItem label={t.projectNav.monetisation} trailing={<ChevronRightSmIcon />} onClick={() => guard()} />
        <NavItem label={t.projectNav.quality} trailing={<ChevronRightSmIcon />} onClick={() => guard()} />
        <NavItem
          label={t.projectNav.customBoard}
          trailing={chevron(customBoardOpen)}
          ariaExpanded={customBoardOpen}
          onClick={() => setCustomBoardOpen(!customBoardOpen)}
        />
        {customBoardOpen && <Reveal className="flex w-full flex-col gap-1 pb-3">{item("addBoard", <AddPlusIcon />, "child")}</Reveal>}
        {item("tracking")}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-1">
        <NavItem icon={<HomeIcon />} label={t.nav.workspace} onClick={() => guard(() => router.push(href("/")))} />
        <SettingsNavItem />
      </div>
    </>
  );
}

/** 섹션을 펼치면 새로 보인 항목이 가려져 있을 때 부드럽게 스크롤해서 보여준다 */
function Reveal({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
