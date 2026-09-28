import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { currentStudio, currentUser } from "@/data/workspace";

// 워크스페이스 영역 (워크스페이스, Studio members). 프로젝트 화면은 app/projects/[projectId].
export default function WorkspaceLayout({ children }: LayoutProps<"/">) {
  return (
    <WorkspaceShell user={currentUser} studio={currentStudio}>
      {children}
    </WorkspaceShell>
  );
}
