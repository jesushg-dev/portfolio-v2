"use client";

import { useState, type FC, type ReactNode } from "react";

import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";
import { isRenderableProjectImage } from "@/utils/tools/image";

interface ProjectThumbnailProps {
  image: string | null | undefined;
  title: string;
  size?: number;
  className?: string;
  fallback?: ReactNode;
}

export const ProjectThumbnail: FC<ProjectThumbnailProps> = ({
  image,
  title,
  size = 40,
  className,
  fallback,
}) => {
  const [failed, setFailed] = useState(false);
  const trimmed = image?.trim() ?? "";
  const canRender = isRenderableProjectImage(trimmed) && !failed;

  if (!canRender) {
    return (
      <div
        className={cn(
          "bg-muted flex shrink-0 items-center justify-center rounded-md",
          className,
        )}
        style={{ width: size, height: size }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <MediaImage
      src={trimmed}
      alt={title}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-md object-cover", className)}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};
