import type { ReactNode } from "react";

import { processEyebrowStyles } from "@/features/process-pages/components/process-page-styles";
import { ProcessReveal } from "@/features/process-pages/components/process-reveal";
import { cn } from "@/lib/utils";

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
      className="relative overflow-hidden px-4 pt-8 pb-4 sm:px-6 md:pt-12 lg:px-20"
    >
      <div className="from-primary/8 via-background to-background absolute inset-0 -z-10 bg-linear-to-b" />

      <ProcessReveal>
        <div className="mx-auto max-w-[740px] text-center">
          <p
            className={cn(
              processEyebrowStyles,
              "mb-3 inline-flex items-center gap-2 font-mono tracking-wide normal-case",
            )}
          >
            <span aria-hidden className="bg-primary size-1.5 rounded-sm" />
            {eyebrow}
          </p>

          <h1 className="text-foreground mb-4 text-[clamp(2rem,5vw,3.125rem)] leading-[1.15] font-extrabold tracking-tight">
            {title} <span className="text-primary">{titleHighlight}</span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-9 max-w-xl text-lg leading-relaxed">
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
