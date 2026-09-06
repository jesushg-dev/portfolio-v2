"use client";

import { MediaImage } from "@/components/shared/media-image";
import { motion, useReducedMotion } from "motion/react";

import { ProcessRevealStaggerItem } from "@/features/process-pages/components/process-reveal";

interface UsesLinkedCardProps {
  href: string;
  title: string;
  description?: string;
  imageSrc: string;
  imageAlt: string;
  index: number;
  layout?: "row" | "stack";
}

export function UsesLinkedCard({
  href,
  title,
  description,
  imageSrc,
  imageAlt,
  index,
  layout = "row",
}: UsesLinkedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (layout === "stack") {
    return (
      <ProcessRevealStaggerItem index={index % 10}>
        <a
          href={href}
          title={title}
          target="_blank"
          rel="noopener noreferrer"
          className="group/item relative no-underline"
        >
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
            className="flex flex-col items-center gap-1.5"
          >
            <MediaImage
              src={imageSrc}
              alt={imageAlt}
              width={48}
              height={48}
              className="aspect-square size-12 rounded-md object-contain shadow-sm transition-transform duration-200 group-hover/item:scale-105"
            />
            <p className="text-muted-foreground group-hover/item:text-foreground line-clamp-2 text-center text-[11px] underline decoration-current/20 decoration-dashed underline-offset-2 transition-colors group-hover/item:decoration-current group-hover/item:decoration-solid">
              {title}
            </p>
          </motion.div>
        </a>
      </ProcessRevealStaggerItem>
    );
  }

  return (
    <ProcessRevealStaggerItem index={index % 10}>
      <a
        href={href}
        title={title}
        target="_blank"
        rel="noopener noreferrer"
        className="group/item relative no-underline"
      >
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          className="flex flex-row items-start gap-4"
        >
          <MediaImage
            src={imageSrc}
            alt={imageAlt}
            width={48}
            height={48}
            className="aspect-square size-12 shrink-0 rounded-md object-contain shadow-sm transition-transform duration-200 group-hover/item:scale-105"
          />
          <div className="flex flex-1 flex-col gap-1 pt-0.5">
            <p className="text-foreground/85 group-hover/item:text-foreground line-clamp-2 text-sm underline decoration-current/20 decoration-dashed underline-offset-2 transition-colors group-hover/item:decoration-current group-hover/item:decoration-solid">
              {title}
            </p>
            {description ? (
              <p className="text-muted-foreground line-clamp-2 text-xs leading-normal">
                {description}
              </p>
            ) : null}
          </div>
        </motion.div>
      </a>
    </ProcessRevealStaggerItem>
  );
}
