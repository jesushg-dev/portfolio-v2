"use client";

import { useState, type FC } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { siLoader } from "@/utils/tools/image";
import { getSkillBadgeColor, getSkillInitials } from "./lib/skill-display";

interface SkillIconProps {
  image: string;
  title: string;
  className?: string;
}

const SkillIcon: FC<SkillIconProps> = ({ image, title, className }) => {
  const [failed, setFailed] = useState(false);
  const showFallback = failed || !image.trim();

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
    <Image
      width={17}
      height={17}
      src={image}
      alt=""
      loader={siLoader}
      className={cn("h-[17px] w-[17px] shrink-0", className)}
      onError={() => setFailed(true)}
    />
  );
};

export default SkillIcon;
