import Image from "next/image";

interface HeroPhotoImageProps {
  photoUrl: string;
  imageAlt: string;
}

export default function HeroPhotoImage({
  photoUrl,
  imageAlt,
}: HeroPhotoImageProps) {
  return (
    <Image
      src={photoUrl}
      alt={imageAlt}
      width={320}
      height={320}
      sizes="(min-width: 768px) 320px, 256px"
      priority
      fetchPriority="high"
      className="absolute top-0 left-1/2 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover transition-transform duration-500 hover:scale-105"
    />
  );
}
