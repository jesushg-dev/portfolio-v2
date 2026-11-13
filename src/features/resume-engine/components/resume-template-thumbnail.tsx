"use client";

import type { FC } from "react";
import { FileText, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  CvTemplateVersion,
  ResumeTemplate,
} from "../lib/template-registry";

interface ResumeTemplateThumbnailProps {
  version?: CvTemplateVersion;
  template?: ResumeTemplate;
  className?: string;
  selected?: boolean;
}

export const TemplateV1Thumbnail: FC<{
  selected?: boolean;
  className?: string;
}> = ({ selected, className }) => {
  return (
    <div
      className={cn(
        "relative flex aspect-[1/1.414] h-full max-h-16 w-auto items-center justify-center select-none",
        className,
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden rounded-[0.2rem] border bg-white shadow-2xs transition-transform duration-200",
          selected
            ? "border-primary/80 ring-1 ring-primary/40 shadow-xs"
            : "border-border/80 group-hover:scale-[1.02]",
        )}
      >
        {/* Navy Header Banner */}
        <div className="flex h-3.5 w-full items-center justify-between bg-[#1a4b8c] px-1">
          <div className="flex flex-col gap-0.5">
            <span className="h-1 w-6 rounded-xs bg-white" />
            <span className="h-0.5 w-8 rounded-xs bg-white/70" />
          </div>
          <div className="flex size-2.5 shrink-0 items-center justify-center rounded-xs border border-white/60 bg-white/20 text-white">
            <User className="size-1.5 opacity-90" />
          </div>
        </div>

        {/* 2-Column Body (V1: ~36% Left / ~64% Right) */}
        <div className="grid flex-1 grid-cols-[36%_64%] gap-1 p-1">
          {/* Left Column: Contact, Education, Languages, Skills */}
          <div className="flex flex-col gap-0.5">
            <div className="space-y-0.5">
              <span className="block h-0.5 w-4 rounded-xs bg-[#1a4b8c]" />
              <span className="block h-0.5 w-5 rounded-xs bg-zinc-300" />
              <span className="block h-0.5 w-4 rounded-xs bg-zinc-300" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <span className="block h-0.5 w-4 rounded-xs bg-[#1a4b8c]" />
              <span className="block h-0.5 w-5 rounded-xs bg-zinc-400" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <span className="block h-0.5 w-4 rounded-xs bg-[#1a4b8c]" />
              <span className="block h-0.5 w-4 rounded-xs bg-zinc-300" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <span className="block h-0.5 w-5 rounded-xs bg-[#1a4b8c]" />
              <div className="grid grid-cols-2 gap-0.5">
                <span className="block h-0.5 w-2 rounded-xs bg-zinc-300" />
                <span className="block h-0.5 w-2 rounded-xs bg-zinc-300" />
              </div>
            </div>
          </div>

          {/* Right Column: About Me, Experience, Soft Skills */}
          <div className="flex flex-col gap-0.5">
            <div className="space-y-0.5">
              <span className="block h-0.5 w-5 rounded-xs bg-[#1a4b8c]" />
              <span className="block h-0.5 w-full rounded-xs bg-zinc-300" />
              <span className="block h-0.5 w-3/4 rounded-xs bg-zinc-300" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <span className="block h-0.5 w-8 rounded-xs bg-[#1a4b8c]" />
              {/* Job 1 */}
              <div className="space-y-0.5">
                <span className="block h-0.5 w-7 rounded-xs bg-zinc-600 font-bold" />
                <span className="block h-0.5 w-full rounded-xs bg-zinc-300" />
                <span className="block h-0.5 w-4/5 rounded-xs bg-zinc-300" />
              </div>
              {/* Job 2 */}
              <div className="space-y-0.5 pt-0.5">
                <span className="block h-0.5 w-6 rounded-xs bg-zinc-600" />
                <span className="block h-0.5 w-3/4 rounded-xs bg-zinc-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TemplateV2Thumbnail: FC<{
  selected?: boolean;
  className?: string;
}> = ({ selected, className }) => {
  return (
    <div
      className={cn(
        "relative flex aspect-[1/1.25] h-full max-h-16 w-auto items-center justify-center select-none",
        className,
      )}
      aria-hidden="true"
    >
      {/* Page 2 (stacked behind with subtle rotation & offset) */}
      <div
        className={cn(
          "absolute inset-0 flex aspect-[1/1.414] h-full w-[94%] flex-col overflow-hidden rounded-[0.2rem] border border-border/70 bg-zinc-100 shadow-2xs transition-transform duration-200",
          "translate-x-1 translate-y-1 rotate-2 group-hover:translate-x-1.5 group-hover:rotate-3",
        )}
      >
        <div className="h-1.5 w-full bg-[#1a4b8c]/25" />
        <div className="flex flex-1 flex-col gap-0.5 p-1">
          <div className="flex items-center gap-0.5">
            <span className="h-1 w-0.5 rounded-xs bg-[#1a4b8c]" />
            <span className="h-0.5 w-6 rounded-xs bg-[#1a4b8c]" />
          </div>
          <span className="block h-0.5 w-[90%] rounded-xs bg-zinc-300" />
          <span className="block h-0.5 w-[75%] rounded-xs bg-zinc-300" />
        </div>
      </div>

      {/* Page 1 (front sheet) */}
      <div
        className={cn(
          "relative z-10 flex aspect-[1/1.414] h-full w-[94%] flex-col overflow-hidden rounded-[0.2rem] border bg-white shadow-xs transition-transform duration-200",
          selected
            ? "border-primary/80 ring-1 ring-primary/40 shadow-xs"
            : "border-border/80 group-hover:scale-[1.01]",
        )}
      >
        {/* Navy Header with Photo on Right */}
        <div className="flex h-3.5 w-full items-center justify-between bg-[#1a4b8c] px-1">
          <div className="flex flex-col gap-0.5">
            <span className="h-1 w-7 rounded-xs bg-white" />
            <span className="h-0.5 w-8 rounded-xs bg-white/75" />
          </div>
          <div className="flex size-2.5 shrink-0 items-center justify-center rounded-xs border border-white/60 bg-white/20 text-white">
            <User className="size-1.5 opacity-90" />
          </div>
        </div>

        {/* 2-Column Body (V2: ~58% Left with Blue Bar Accents / ~42% Right) */}
        <div className="grid flex-1 grid-cols-[58%_42%] gap-1 p-1">
          {/* Left Column: Sobre Mí, Experiencia */}
          <div className="flex flex-col gap-0.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-0.5">
                <span className="h-1 w-0.5 rounded-xs bg-[#1a4b8c]" />
                <span className="h-0.5 w-4 rounded-xs bg-[#1a4b8c]" />
              </div>
              <span className="block h-0.5 w-full rounded-xs bg-zinc-300" />
              <span className="block h-0.5 w-3/4 rounded-xs bg-zinc-300" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-0.5">
                <span className="h-1 w-0.5 rounded-xs bg-[#1a4b8c]" />
                <span className="h-0.5 w-6 rounded-xs bg-[#1a4b8c]" />
              </div>
              {/* Job 1 */}
              <div className="space-y-0.5">
                <span className="block h-0.5 w-6 rounded-xs bg-zinc-600" />
                <span className="block h-0.5 w-full rounded-xs bg-zinc-300" />
              </div>
            </div>
          </div>

          {/* Right Column: Skills, Education, Certifications, Availability */}
          <div className="flex flex-col gap-0.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-0.5">
                <span className="h-1 w-0.5 rounded-xs bg-[#1a4b8c]" />
                <span className="h-0.5 w-5 rounded-xs bg-[#1a4b8c]" />
              </div>
              <span className="block h-0.5 w-full rounded-xs bg-zinc-300" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-0.5">
                <span className="h-1 w-0.5 rounded-xs bg-[#1a4b8c]" />
                <span className="h-0.5 w-4 rounded-xs bg-[#1a4b8c]" />
              </div>
              <span className="block h-0.5 w-full rounded-xs bg-zinc-400" />
            </div>

            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-0.5">
                <span className="h-1 w-0.5 rounded-xs bg-[#1a4b8c]" />
                <span className="h-0.5 w-5 rounded-xs bg-[#1a4b8c]" />
              </div>
              <div className="flex items-center gap-0.5">
                <span className="size-1 rounded-full bg-emerald-500" />
                <span className="h-0.5 w-4 rounded-xs bg-emerald-600/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResumeTemplateThumbnail: FC<ResumeTemplateThumbnailProps> = ({
  version,
  template,
  className,
  selected = false,
}) => {
  const effectiveVersion: CvTemplateVersion =
    version ?? (template?.id as CvTemplateVersion) ?? "v2";

  if (effectiveVersion === "v1") {
    return <TemplateV1Thumbnail selected={selected} className={className} />;
  }

  if (effectiveVersion === "v2") {
    return <TemplateV2Thumbnail selected={selected} className={className} />;
  }

  return (
    <div
      className={cn(
        "flex aspect-[1/1.414] h-full max-h-16 flex-col items-center justify-center rounded-[0.2rem] border border-border/60 bg-muted/40 p-1 text-center text-muted-foreground",
        className,
      )}
      aria-hidden="true"
    >
      <FileText className="size-4 opacity-60" />
      <span className="mt-0.5 text-[0.5rem] font-semibold uppercase tracking-wider">
        {effectiveVersion}
      </span>
    </div>
  );
};
