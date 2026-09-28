"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AgentPanel } from "@/components/agent/agent-panel";
import { AgentProvider, useAgent } from "@/components/agent/agent-provider";
import { LeaveSetupModal } from "@/components/setup/leave-setup-modal";
import type { Project, User } from "@/data/types";
import { projectMembers } from "@/data/workspace";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "./app-shell";
import { NavGuardContext } from "./nav-guard";
import { CustomBoardModal } from "./custom-board-modal";
import { ProjectNav, projectRoutes } from "./project-nav";
import { ProjectMembersPopover } from "./project-members-popover";

type SetupType = "mapping" | "logging";

type ProjectShellControls = {
  /** 셋업 중이면 내비 이동·팝업 X가 Leave setup 모달을 띄운다. null = 셋업 아님 */
  setActiveSetup: (type: SetupType | null) => void;
  /** Leave 버튼 동작. 없으면 hover만 (매핑) */
  setLeaveAction: (action: (() => void) | null) => void;
  /** 온보딩 팝업 X 등에서 직접 Leave setup 모달 열기 */
  requestLeave: () => void;
  setAnalyticsOpen: (open: boolean) => void;
};

const ProjectShellContext = createContext<ProjectShellControls | null>(null);

export function useProjectShell() {
  const value = useContext(ProjectShellContext);
  if (!value) throw new Error("useProjectShell must be used inside <ProjectShell>");
  return value;
}

export function ProjectShell({ user, project, children }: { user: User; project: Project; children: ReactNode }) {
  const [activeSetup, setActiveSetup] = useState<SetupType | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveAction, setLeaveActionState] = useState<{ run: () => void } | null>(null);
  /** 내비로 나가려던 곳 — Leave를 누르면 실제로 이동한다 (진행 상태는 저장돼 Tracking에서 이어서) */
  const [pendingNav, setPendingNav] = useState<{ run: () => void } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [membersAnchor, setMembersAnchor] = useState<HTMLElement | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);

  // 지금 화면 → 내비 선택 (/projects/[id]/overview …)
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean).pop();
  const selected = (Object.entries(projectRoutes).find(([, route]) => route === segment)?.[0] ?? null) as Parameters<
    typeof ProjectNav
  >[0]["selected"];
  // 대시보드 화면으로 오면 Analytics가 펼쳐진 내비 (Figma). Tracking은 MappingSetup이 정한다
  const [prevSegment, setPrevSegment] = useState(segment);
  if (segment !== prevSegment) {
    setPrevSegment(segment);
    if (segment !== "tracking") setAnalyticsOpen(true);
  }

  const guard = useMemo(
    () => ({
      guard: (action?: () => void) => {
        if (!activeSetup) return action?.();
        setPendingNav(action ? { run: action } : null);
        setLeaveOpen(true);
      },
    }),
    [activeSetup],
  );

  const controls = useMemo<ProjectShellControls>(
    () => ({
      setActiveSetup,
      setLeaveAction: (action) => setLeaveActionState(action ? { run: action } : null),
      requestLeave: () => {
        setPendingNav(null);
        setLeaveOpen(true);
      },
      setAnalyticsOpen,
    }),
    [],
  );

  return (
    <ProjectShellContext.Provider value={controls}>
      <NavGuardContext.Provider value={guard}>
        {/* 셋업(매핑·로깅) 중에는 AI Agent를 쓸 수 없다 (버튼은 hover만) */}
        <AgentProvider enabled={!activeSetup}>
          <ProjectAppShell
            user={user}
            project={project}
            nav={
              <ProjectNav
                projectId={project.id}
                selected={selected}
                analyticsOpen={analyticsOpen}
                onAnalyticsOpenChange={setAnalyticsOpen}
                onProjectMembers={(anchor) => setMembersAnchor((a) => (a ? null : anchor))}
                onAddBoard={() => setBoardOpen(true)}
              />
            }
          >
            {children}
          </ProjectAppShell>
        </AgentProvider>
        {membersAnchor && (
          <ProjectMembersPopover anchor={membersAnchor} members={projectMembers} onClose={() => setMembersAnchor(null)} />
        )}
        <CustomBoardModal open={boardOpen} owner={projectMembers[0]} onClose={() => setBoardOpen(false)} />
        <LeaveSetupModal
          open={leaveOpen}
          type={activeSetup ?? "mapping"}
          onContinue={() => setLeaveOpen(false)}
          onLeave={
            pendingNav || leaveAction
              ? () => {
                  setLeaveOpen(false);
                  (pendingNav ?? leaveAction)?.run();
                }
              : undefined
          }
        />
      </NavGuardContext.Provider>
    </ProjectShellContext.Provider>
  );
}

function ProjectAppShell({ user, project, nav, children }: { user: User; project: Project; nav: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  const agent = useAgent();
  return (
    <AppShell
      user={user}
      select={{ name: project.name, thumbnail: project.thumbnail, thumbnailBackdrop: false, ariaLabel: t.topBar.projectSelect }}
      nav={nav}
      onAiAgent={agent.toggle}
      overlay={<AgentPanel />}
    >
      {children}
    </AppShell>
  );
}
