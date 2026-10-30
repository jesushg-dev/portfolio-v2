"use client";

import { useSearchParams } from "next/navigation";
import { ProjectsCatalogView } from "./projects-catalog-view";
import type { ProjectType } from "@/utils/interfaces/types";

export function ProjectsCatalogClient({
  projects,
}: {
  projects: ProjectType[];
}) {
  const search = useSearchParams();
  return (
    <ProjectsCatalogView
      initialProjects={projects}
      initialSearchParams={Object.fromEntries(search.entries())}
    />
  );
}
