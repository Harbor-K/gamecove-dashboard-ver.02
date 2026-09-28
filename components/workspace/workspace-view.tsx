"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusIcon, SearchIcon, ViewGridIcon, ViewListIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import type { Platform, Project, ProjectRole } from "@/data/types";
import { useI18n } from "@/lib/i18n";
import { isSetupComplete } from "@/lib/setup-store";
import { ProjectCard } from "./project-card";

type Filter = "platform" | "role";

// Figma "워크스페이스 (셋업 전)" 본문: pt200, gap40, 폭 1200.
export function WorkspaceView({
  projects: projectsBeforeSetup,
  projectsAfterSetup,
  platformValues,
  roleValues,
}: {
  projects: Project[];
  /** 셋업 흐름을 끝낸 뒤 보이는 값 (셋업 후 워크스페이스) */
  projectsAfterSetup: Project[];
  platformValues: (Platform | "all")[];
  roleValues: (ProjectRole | "all")[];
}) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [role, setRole] = useState<ProjectRole | "all">("all");
  // 두 드롭다운이 동시에 열리지 않도록 하나만 기억한다.
  const [openFilter, setOpenFilter] = useState<Filter | null>(null);

  // 셋업 흐름을 끝냈으면 셋업 후 워크스페이스 (앱 안 이동 동안 유지되는 값이라 첫 렌더에 한 번 읽는다)
  const [projects] = useState(() => (isSetupComplete() ? projectsAfterSetup : projectsBeforeSetup));
  const projectHref = (project: Project) => href(`/projects/${project.id}/${project.needsSetup ? "tracking" : "overview"}`);
  // 프로젝트 화면을 미리 받아 둔다 → 누르면 바로 바뀐다
  useEffect(() => {
    for (const p of projects) router.prefetch(projectHref(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, router]);
  const visible = projects.filter(
    (p) =>
      (platform === "all" || p.platform === platform) &&
      (role === "all" || p.role === role) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const optionLabel = (value: string, labels: Record<string, string>) =>
    value === "all" ? t.common.all : labels[value];

  return (
    <div className="flex w-full flex-col items-center gap-10 pt-[200px]">
      <div className="flex w-[1200px] max-w-full items-center gap-4">
        <div className="flex items-end gap-3 whitespace-nowrap">
          <h1 className="text-display-page text-text-primary">{t.workspace.title}</h1>
          <span className="text-body-default text-text-secondary">{t.workspace.projectCount(visible.length)}</span>
        </div>
        <div className="h-px min-w-px flex-1" />
        <Button variant="primary" icon={<PlusIcon />}>
          {t.workspace.newProject}
        </Button>
      </div>

      <div className="flex w-[1200px] max-w-full flex-col gap-6">
        <div className="flex w-full items-center gap-2">
          <label className="flex h-control-48 min-w-px flex-1 items-center gap-3 rounded-lg inset-ring inset-ring-border-default bg-bg-surface px-3">
            <SearchIcon className="shrink-0 text-icon-primary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.workspace.searchPlaceholder}
              aria-label={t.workspace.searchPlaceholder}
              // 입력 중에도 테두리·outline 변화 없음 (디자이너 요청)
              className="min-w-0 flex-1 bg-transparent text-body-default text-text-primary outline-none focus-visible:outline-none placeholder:text-text-secondary"
            />
          </label>
          <FilterSelect
            label={platform === "all" ? t.workspace.allPlatforms : t.platform[platform]}
            ariaLabel={t.workspace.platformFilter}
            options={platformValues.map((value) => ({ value, label: optionLabel(value, t.platform) }))}
            value={platform}
            onChange={setPlatform}
            open={openFilter === "platform"}
            onOpenChange={(open) => setOpenFilter(open ? "platform" : null)}
          />
          <FilterSelect
            label={role === "all" ? t.workspace.allRoles : t.role[role]}
            ariaLabel={t.workspace.roleFilter}
            options={roleValues.map((value) => ({ value, label: optionLabel(value, t.role) }))}
            value={role}
            onChange={setRole}
            open={openFilter === "role"}
            onOpenChange={(open) => setOpenFilter(open ? "role" : null)}
          />
          {/* Figma `Icon button`: Selected = color/bg/selected, hover = color/bg/hover */}
          <div className="flex items-start gap-2">
            <button
              type="button"
              aria-label={t.workspace.gridView}
              aria-pressed
              className="flex size-12 items-center justify-center rounded-lg inset-ring inset-ring-border-default bg-bg-selected text-icon-primary cursor-pointer hover:bg-bg-hover"
            >
              <ViewGridIcon />
            </button>
            {/* 리스트 보기 화면은 아직 없어서 hover만 */}
            <button
              type="button"
              aria-label={t.workspace.listView}
              aria-pressed={false}
              className="flex size-12 items-center justify-center rounded-lg inset-ring inset-ring-border-default text-icon-primary cursor-pointer hover:bg-bg-hover"
            >
              <ViewListIcon />
            </button>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 gap-8">
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              // 셋업이 필요한 프로젝트(BounceBounce)는 Tracking의 매핑 셋업부터. 나머지는 대시보드 구현 후 연결.
              // 셋업이 필요한 프로젝트는 Tracking(셋업, 진행 중이면 이어서), 나머지는 대시보드 Overview
              onOpen={() => router.push(projectHref(project))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
