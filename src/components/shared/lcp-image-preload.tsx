import { getHeroImageProps } from "@/lib/seo/hero-image";
import { preload } from "react-dom";

interface LcpImagePreloadProps {
  href: string;
}

/** Desktop hero photo is above the fold; mobile's LCP is the introductory text. */
export default function LcpImagePreload({ href }: LcpImagePreloadProps) {
  const { src, srcSet, sizes } = getHeroImageProps(href);

  preload(src, {
    as: "image",
    media: "(min-width: 64rem)",
    imageSrcSet: srcSet,
    imageSizes: sizes,
    fetchPriority: "high",
  });
  return null;
}
