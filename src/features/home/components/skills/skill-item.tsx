"use client";

import type { FC } from "react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { skillSlugFromTitle } from "@/utils/tools/skill-slug";
import SkillIcon from "./skill-icon";

interface SkillItemProps {
  image: string;
  title: string;
  featured: boolean;
}

const SkillItem: FC<SkillItemProps> = ({ image, title, featured }) => {
  return (
    <Link
      href={{
        pathname: "/skills/[slug]",
        params: { slug: skillSlugFromTitle(title) },
      }}
      scroll={false}
      className={cn(
        "group/item text-foreground inline-flex items-center gap-2 border-none bg-transparent p-0.5 text-sm transition-opacity duration-150",
        featured ? "opacity-100" : "opacity-[0.68] hover:opacity-100",
      )}
      title={title}
    >
      <SkillIcon image={image} title={title} />
      <span
        className={cn(
          "text-foreground group-hover/item:text-primary group-hover/item:decoration-primary group-hover/item:underline group-hover/item:decoration-[1.5px] group-hover/item:underline-offset-4",
          featured ? "font-medium" : "font-normal",
        )}
      >
        {title}
      </span>
    </Link>
  );
};

export default SkillItem;
