import Image, { type ImageProps } from "next/image";

import { classifyMediaSrc } from "@/utils/tools/image";

type MediaImageProps = Omit<ImageProps, "loader" | "priority">;

/**
 * next/image wrapper for stored media (local path or absolute URL).
 * Cloudinary images use responsive optimization; other tenant CDNs stay direct.
 */
export function MediaImage({
  src,
  unoptimized,
  alt = "",
  ...props
}: MediaImageProps) {
  if (typeof src !== "string") {
    return <Image src={src} alt={alt} unoptimized={unoptimized} {...props} />;
  }

  const remote = classifyMediaSrc(src) === "remote-url";
  const directRemote = remote && new URL(src).hostname !== "res.cloudinary.com";

  return (
    <Image
      alt={alt}
      {...props}
      src={src}
      unoptimized={unoptimized ?? directRemote}
    />
  );
}
