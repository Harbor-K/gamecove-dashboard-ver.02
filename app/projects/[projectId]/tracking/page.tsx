import { notFound } from "next/navigation";
import { MappingSetup } from "@/components/mapping/mapping-setup";
import {
  aiMappedGraph,
  aiNodeDetails,
  defaultApplyTo,
  emptyNodeDetails,
  mappingLoadingMs,
  mappingOnboardingMedia,
  scriptReview,
} from "@/data/mapping";
import { findProject } from "@/data/workspace";

export default async function TrackingPage({ params }: PageProps<"/projects/[projectId]/tracking">) {
  const { projectId } = await params;
  const project = findProject(projectId);
  if (!project) notFound();

  return (
    <MappingSetup
      initialGraph={aiMappedGraph}
      media={mappingOnboardingMedia}
      aiDetails={aiNodeDetails}
      emptyDetails={emptyNodeDetails}
      defaultApplyTo={defaultApplyTo}
      scriptReview={scriptReview}
      loadingMs={mappingLoadingMs}
    />
  );
}
