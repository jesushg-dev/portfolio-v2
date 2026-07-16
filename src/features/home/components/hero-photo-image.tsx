import Image from "next/image";

import { getHeroLcpImageUrl, HERO_LCP_WIDTH } from "./hero-lcp-image";

interface HeroPhotoImageProps {
  photoUrl: string;
  imageAlt: string;
}

const DESKTOP_LCP_WIDTH = 320;

export default function HeroPhotoImage({
  photoUrl,
  imageAlt,
}: HeroPhotoImageProps) {
  const optimizedSrc = getHeroLcpImageUrl(photoUrl);

  return (
    <Image
      src={optimizedSrc}
      alt={imageAlt}
      width={HERO_LCP_WIDTH}
      height={Math.round(HERO_LCP_WIDTH * (4 / 3))}
      sizes={`(max-width: 767px) ${HERO_LCP_WIDTH}px, ${DESKTOP_LCP_WIDTH}px`}
      priority
      fetchPriority="high"
      unoptimized
      className="absolute top-0 left-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}
