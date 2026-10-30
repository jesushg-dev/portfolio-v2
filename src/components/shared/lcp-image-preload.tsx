import { getHeroImageProps } from "@/lib/seo/hero-image";

interface LcpImagePreloadProps {
  href: string;
}

/** Hoisted to head; let the browser choose the same candidate as the hero image. */
export default function LcpImagePreload({ href }: LcpImagePreloadProps) {
  const { src, srcSet, sizes } = getHeroImageProps(href);

  return (
    <link
      rel="preload"
      as="image"
      href={src}
      imageSrcSet={srcSet}
      imageSizes={sizes}
      fetchPriority="high"
    />
  );
}
