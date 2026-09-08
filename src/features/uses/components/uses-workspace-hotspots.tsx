"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { usesItemAnchorId } from "../lib/uses-item-anchor";

export interface UsesWorkspacePublicTag {
  itemId: string;
  title: string;
  xPercent: number;
  yPercent: number;
}

interface UsesWorkspaceHotspotsProps {
  tags: UsesWorkspacePublicTag[];
}

export function UsesWorkspaceHotspots({ tags }: UsesWorkspaceHotspotsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      <TooltipProvider delay={150}>
        {tags.map((tag) => (
          <Tooltip key={tag.itemId}>
            <TooltipTrigger
              render={
                <a
                  href={`#${usesItemAnchorId(tag.itemId)}`}
                  aria-label={tag.title}
                  className="focus-visible:ring-primary pointer-events-auto absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2"
                  style={{
                    left: `${tag.xPercent}%`,
                    top: `${tag.yPercent}%`,
                  }}
                >
                  <span className="bg-primary ring-background size-3 rounded-full ring-2 motion-safe:animate-pulse" />
                </a>
              }
            />
            <TooltipContent side="top" sideOffset={6}>
              {tag.title}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
