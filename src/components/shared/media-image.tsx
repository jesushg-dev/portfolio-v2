import Image, { type ImageProps } from "next/image";

import { classifyMediaSrc } from "@/utils/tools/image";

type MediaImageProps = Omit<ImageProps, "loader">;

/**
 * next/image wrapper for stored media (local path or absolute URL).
 * Remote URLs skip the optimizer so tenant CDNs are not rewritten.
 */
export function MediaImage({ src, unoptimized, ...props }: MediaImageProps) {
  if (typeof src !== "string") {
    return <Image src={src} unoptimized={unoptimized} {...props} />;
  }

  const remote = classifyMediaSrc(src) === "remote-url";

  return (
    <Image
      {...props}
      src={src}
      unoptimized={unoptimized ?? remote}
    />
  );
}
