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
        "group/item text-foreground active:bg-muted/40 inline-flex min-h-11 w-full items-center gap-2.5 rounded-lg border-none bg-transparent px-2.5 py-2 text-sm transition-opacity duration-150 sm:min-h-0 sm:w-auto sm:gap-2 sm:p-0.5 sm:active:bg-transparent",
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
