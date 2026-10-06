"use client";

import { useState, type FC } from "react";

import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";
import { isRenderableProjectImage } from "@/utils/tools/image";
import { getSkillBadgeColor, getSkillInitials } from "./lib/skill-display";

export interface SkillIconProps {
  image: string;
  title: string;
  size?: "sm" | "md" | "lg";
  tile?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: {
    tile: "size-7 rounded-lg text-[11px]",
    img: "size-4",
  },
  md: {
    tile: "size-8 rounded-xl text-xs",
    img: "size-5",
  },
  lg: {
    tile: "size-11 rounded-2xl text-sm",
    img: "size-7",
  },
};

const SkillIcon: FC<SkillIconProps> = ({
  image,
  title,
  size = "md",
  tile = false,
  className,
}) => {
  const [failed, setFailed] = useState(false);
  const trimmed = image.trim();
  const showFallback = failed || !isRenderableProjectImage(trimmed);
  const badgeColor = getSkillBadgeColor(title);
  const initials = getSkillInitials(title);

  if (tile) {
    const config = sizeClasses[size];
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center font-mono font-black shadow-2xs transition-transform duration-200",
          config.tile,
          className,
        )}
        style={{
          backgroundColor: `${badgeColor}1a`,
          color: badgeColor,
        }}
        aria-hidden="true"
      >
        {showFallback ? (
          <span>{initials}</span>
        ) : (
          <MediaImage
            width={size === "lg" ? 28 : size === "md" ? 20 : 16}
            height={size === "lg" ? 28 : size === "md" ? 20 : 16}
            src={trimmed}
            alt=""
            className={cn("object-contain", config.img)}
            onError={() => setFailed(true)}
          />
        )}
      </span>
    );
  }

  if (showFallback) {
    return (
      <span
        className={cn("font-mono text-xs leading-none font-bold", className)}
        style={{ color: badgeColor }}
        aria-hidden="true"
      >
        {initials}
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
