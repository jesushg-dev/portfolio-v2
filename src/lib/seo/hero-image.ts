import { getImageProps } from "next/image";

/** Shared candidates keep the responsive hero request and its preload identical. */
export function getHeroImageProps(photoUrl: string, imageAlt = "") {
  const isCloudinary = photoUrl.startsWith("https://res.cloudinary.com/");

  return getImageProps({
    src: photoUrl,
    alt: imageAlt,
    // Portrait source aspect ratio; CSS controls the displayed crop and size.
    width: 1086,
    height: 1448,
    sizes: "(min-width: 64rem) 28rem, (min-width: 40rem) 26rem, 22rem",
    loading: "eager",
    fetchPriority: "high",
    unoptimized: !isCloudinary && !photoUrl.startsWith("/"),
  }).props;
}
