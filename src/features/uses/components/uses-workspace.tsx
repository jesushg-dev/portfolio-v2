"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { USES_WORKSPACE_IMAGE_FALLBACK } from "../data";
import { usesContainerClassName } from "./uses-layout";
import {
  UsesWorkspaceHotspots,
  type UsesWorkspacePublicTag,
} from "./uses-workspace-hotspots";

interface UsesWorkspaceProps {
  show: boolean;
  caption: string;
  alt: string;
  imageSrc?: string | null;
  tags?: UsesWorkspacePublicTag[];
}

export function UsesWorkspace({
  show,
  caption,
  alt,
  imageSrc,
  tags = [],
}: UsesWorkspaceProps) {
  const shouldReduceMotion = useReducedMotion();
  const src = imageSrc ?? USES_WORKSPACE_IMAGE_FALLBACK;

  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.figure
          key="workspace"
          className={cn(
            usesContainerClassName,
            "mt-12 flex flex-col items-center gap-2.5 overflow-hidden",
          )}
          initial={
            shouldReduceMotion ? false : { opacity: 0, height: 0, marginTop: 0 }
          }
          animate={{ opacity: 1, height: "auto", marginTop: 48 }}
          exit={
            shouldReduceMotion
              ? undefined
              : { opacity: 0, height: 0, marginTop: 0 }
          }
          transition={{ duration: 0.45, ease: [0.16, 0.8, 0.3, 1] }}
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-xl">
            <Image
              src={src}
              alt={alt}
              fill
              priority
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="object-cover object-center select-none"
            />
            <UsesWorkspaceHotspots tags={tags} />
          </div>
          <figcaption className="text-muted-foreground text-center text-xs">
            {caption}
          </figcaption>
        </motion.figure>
      ) : null}
    </AnimatePresence>
  );
}
