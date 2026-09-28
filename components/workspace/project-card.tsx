"use client";

import type { ReactNode } from "react";
import { PeopleIcon, RobloxLogo, UnityLogo } from "@/components/icons";
import type { Platform, Project } from "@/data/types";
import { useI18n } from "@/lib/i18n";

const platformLogos: Partial<Record<Platform, ReactNode>> = {
  roblox: <RobloxLogo className="shrink-0" />,
  unity: <UnityLogo className="shrink-0" />,
};

// Figma `Card / Project`: h228, p24, gap4, radius 16.
// hover = color/bg/hover (컴포넌트 상태색)
export function ProjectCard({ project, onOpen }: { project: Project; onOpen?: () => void }) {
  const { t } = useI18n();
  const activity =
    project.activity.ago
      ? t.time.activity(project.activity.kind, project.activity.ago.value, project.activity.ago.unit)
      : t.time.justCreated;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
      className="flex h-[228px] min-w-0 flex-col gap-1 rounded-lg inset-ring inset-ring-border-default bg-bg-surface p-6 cursor-pointer hover:bg-bg-hover"
    >
      <h2 className="h-[31px] truncate text-[24px] leading-[1.3] font-semibold tracking-[-0.24px] text-text-primary">
        {project.name}
      </h2>
      <div className="flex h-7 w-fit items-center gap-2 rounded-full pr-3 pl-1 text-text-primary">
        {platformLogos[project.platform]}
        <span className="text-label-default whitespace-nowrap">{t.platform[project.platform]}</span>
      </div>
      <div className="min-h-px flex-1" />
      <div className="flex w-full items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-text-primary" aria-label={t.workspace.memberCount(project.memberCount)}>
            <PeopleIcon className="shrink-0" />
            <span className="text-label-default">{project.memberCount}</span>
          </div>
          <span className="flex h-7 items-center rounded-full inset-ring inset-ring-icon-primary px-2 text-label-default whitespace-nowrap text-text-primary">
            {t.role[project.role]}
          </span>
        </div>
        <div className="h-px min-w-px flex-1" />
        <span className="text-label-default whitespace-nowrap text-text-secondary">{activity}</span>
      </div>
    </article>
  );
}
