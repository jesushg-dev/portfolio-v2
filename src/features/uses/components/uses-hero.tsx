import type { ReactNode } from "react";

import { ProcessReveal } from "@/features/process-pages/components/process-reveal";

import { UsesWorkspace } from "./uses-workspace";
import type { UsesWorkspacePublicTag } from "./uses-workspace-hotspots";

interface UsesHeroProps {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  description: string;
  workspaceCaption: string;
  workspaceAlt: string;
  workspaceImage?: string | null;
  workspaceTags?: UsesWorkspacePublicTag[];
  showWorkspace: boolean;
  filter: ReactNode;
}

export function UsesHero({
  eyebrow,
  title,
  titleHighlight,
  description,
  workspaceCaption,
  workspaceAlt,
  workspaceImage,
  workspaceTags = [],
  showWorkspace,
  filter,
}: UsesHeroProps) {
  return (
    <header
      id="hero"
      className="relative overflow-hidden bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_70%)] px-6 pt-28 pb-16 text-center"
    >
      <ProcessReveal>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-primary mb-3 text-sm font-medium">{eyebrow}</p>

          <h1 className="text-foreground mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title} <span className="text-primary">{titleHighlight}</span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-9 max-w-xl text-base leading-relaxed sm:text-lg">
            {description}
          </p>

          {filter}
        </div>
      </ProcessReveal>

      <UsesWorkspace
        show={showWorkspace}
        caption={workspaceCaption}
        alt={workspaceAlt}
        imageSrc={workspaceImage}
        tags={workspaceTags}
      />
    </header>
  );
}
