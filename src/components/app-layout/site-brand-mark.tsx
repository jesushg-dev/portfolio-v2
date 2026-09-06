import type { FC } from "react";
import Image from "next/image";

import type { SiteBrand } from "@/lib/site-brand/site-brand";
import { cn } from "@/lib/utils";

interface SiteBrandMarkProps {
  brand: SiteBrand;
  className?: string;
  /** Classes for the trailing period on text marks. */
  dotClassName?: string;
}

const SiteBrandMark: FC<SiteBrandMarkProps> = ({
  brand,
  className,
  dotClassName,
}) => {
  if (brand.mode === "image") {
    return (
      <Image
        src={brand.imageUrl}
        alt=""
        width={112}
        height={32}
        unoptimized
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
