import type { FC } from "react";
import { MediaImage } from "@/components/shared/media-image";

import type { SiteBrand } from "@/lib/site-brand/site-brand";
import { cn } from "@/lib/utils";

interface SiteBrandMarkProps {
  brand: SiteBrand;
  className?: string;
  /** Classes for the monogram's square dot or the period on text marks. */
  dotClassName?: string;
}

const SiteBrandMark: FC<SiteBrandMarkProps> = ({
  brand,
  className,
  dotClassName,
}) => {
  if (brand.mode === "monogram") {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 10 82 76"
        fill="none"
        className={cn("h-10 w-auto shrink-0", className)}
      >
        <g
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="square"
          strokeLinejoin="round"
        >
          <path d="M20 35v30c0 10-5 15-15 15H3" />
          <path d="M41 16v52m0-18c0-10 6-16 15-16s15 6 15 16v18" />
        </g>
        <path
          d="M16 15h8v8h-8z"
          fill="currentColor"
          className={cn("transition-colors", dotClassName)}
        />
      </svg>
    );
  }

  if (brand.mode === "image") {
    return (
      <MediaImage
        src={brand.imageUrl}
        alt=""
        width={112}
        height={32}
        className={cn("h-7 w-auto max-w-28 object-contain", className)}
      />
    );
  }

  return (
    <span className={cn("tracking-relaxed", className)}>
      {brand.text}
      <span className={cn("tracking-relaxed transition-colors", dotClassName)}>
        .
      </span>
    </span>
  );
};

export default SiteBrandMark;
