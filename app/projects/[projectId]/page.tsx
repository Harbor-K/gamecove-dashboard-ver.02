import { redirect } from "next/navigation";

// 프로젝트에 들어가면 기본 화면은 Overview
export default async function ProjectRoute({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/overview`);
}
