"use client";

import { useState, type FC } from "react";

import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";
import { isRenderableProjectImage } from "@/utils/tools/image";
import { getSkillBadgeColor, getSkillInitials } from "./lib/skill-display";

interface SkillIconProps {
  image: string;
  title: string;
  className?: string;
}

const SkillIcon: FC<SkillIconProps> = ({ image, title, className }) => {
  const [failed, setFailed] = useState(false);
  const trimmed = image.trim();
  const showFallback = failed || !isRenderableProjectImage(trimmed);

  if (showFallback) {
    return (
      <span
        className={cn("font-mono text-xs leading-none font-bold", className)}
        style={{ color: getSkillBadgeColor(title) }}
        aria-hidden
      >
        {getSkillInitials(title)}
      </span>
    );
  }

  return (
    <MediaImage
      width={17}
      height={17}
      src={trimmed}
      alt=""
      className={cn("size-5 shrink-0 sm:size-4.25", className)}
      onError={() => setFailed(true)}
    />
  );
};

export default SkillIcon;
