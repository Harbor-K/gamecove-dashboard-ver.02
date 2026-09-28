import { WorkspaceView } from "@/components/workspace/workspace-view";
import { platformFilterValues, projects, projectsAfterSetup, roleFilterValues } from "@/data/workspace";

// 셋업 전·후 목록을 둘 다 넘기고, 화면이 셋업 완료 여부로 고른다 (셋업 진행 상태는 클라이언트에만 있다)
export default function WorkspacePage() {
  return (
    <WorkspaceView
      projects={projects}
      projectsAfterSetup={projectsAfterSetup}
      platformValues={platformFilterValues}
      roleValues={roleFilterValues}
    />
  );
}
