import Image from "next/image";

import { optimizeCloudinaryImageUrl } from "@/utils/tools/image";

interface HeroPhotoImageProps {
  photoUrl: string;
  imageAlt: string;
}

const MOBILE_LCP_WIDTH = 384;
const DESKTOP_LCP_WIDTH = 320;

export default function HeroPhotoImage({
  photoUrl,
  imageAlt,
}: HeroPhotoImageProps) {
  const optimizedSrc = optimizeCloudinaryImageUrl(photoUrl, MOBILE_LCP_WIDTH);

  return (
    <Image
      src={optimizedSrc}
      alt={imageAlt}
      width={MOBILE_LCP_WIDTH}
      height={Math.round(MOBILE_LCP_WIDTH * (4 / 3))}
      sizes={`(max-width: 767px) ${MOBILE_LCP_WIDTH}px, ${DESKTOP_LCP_WIDTH}px`}
      priority
      fetchPriority="high"
      className="absolute top-0 left-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}
