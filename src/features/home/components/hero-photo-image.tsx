import { getHeroImageProps } from "@/lib/seo/hero-image";

interface HeroPhotoImageProps {
  photoUrl: string;
  imageAlt: string;
}

export default function HeroPhotoImage({
  photoUrl,
  imageAlt,
}: HeroPhotoImageProps) {
  return (
    // Native img exposes responsive candidates in SSR and shares them with preload.
    // eslint-disable-next-line @next/next/no-img-element -- intentional LCP element
    <img
      {...getHeroImageProps(photoUrl, imageAlt)}
      alt={imageAlt}
      decoding="async"
      fetchPriority="high"
      className="absolute top-0 left-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}
