import { HERO_LCP_WIDTH } from "./hero-lcp-image";

interface HeroPhotoImageProps {
  photoUrl: string;
  imageAlt: string;
}

export default function HeroPhotoImage({
  photoUrl,
  imageAlt,
}: HeroPhotoImageProps) {
  return (
    // Native img keeps the LCP URL in SSR HTML and matches the preload href exactly.
    // eslint-disable-next-line @next/next/no-img-element -- intentional LCP element
    <img
      src={photoUrl}
      alt={imageAlt}
      width={HERO_LCP_WIDTH}
      height={Math.round(HERO_LCP_WIDTH * (4 / 3))}
      decoding="async"
      fetchPriority="high"
      className="absolute top-0 left-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}
