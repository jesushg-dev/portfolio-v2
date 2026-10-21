"use client";

import { useState, type FC } from "react";
import { FolderCode } from "lucide-react";

import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";

interface ProjectCoverImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  fallbackTitle?: string;
}

export const ProjectCoverImage: FC<ProjectCoverImageProps> = ({
  src,
  alt,
  fill = true,
  priority = false,
  sizes,
  className,
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);
  const showFallback = failed || !src?.trim();

  if (showFallback) {
    return (
      <div className="from-primary/20 via-muted to-accent/20 flex h-full w-full items-center justify-center bg-gradient-to-br p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <FolderCode className="text-primary/70 h-12 w-12" />
          {fallbackTitle && (
            <span className="text-foreground text-sm font-semibold tracking-wide uppercase">
              {fallbackTitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <MediaImage
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
};

export default ProjectCoverImage;
