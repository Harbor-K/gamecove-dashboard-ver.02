import { notFound } from "next/navigation";
import { ProjectShell } from "@/components/shell/project-shell";
import { currentUser, findProject, projects } from "@/data/workspace";

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default async function ProjectLayout({ children, params }: LayoutProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const project = findProject(projectId);
  if (!project) notFound();

  return (
    <ProjectShell user={currentUser} project={project}>
      {children}
    </ProjectShell>
  );
}
