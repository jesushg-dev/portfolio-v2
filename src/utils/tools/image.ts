import type { ImageLoaderProps } from "next/image";

export const cdFlagloader = (props: ImageLoaderProps) => {
  const { width, src, quality } = props;
  const qualityString = quality ? `,q_${quality}` : "";
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1743628850/${src}`;
};

export const cloudinaryLoader = (props: ImageLoaderProps) => {
  const { width, src, quality } = props;
  const qualityString = quality ? `,q_${quality}` : "";
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1642524352/portfolio/${src}`;
};

/** Injects delivery transforms into a full Cloudinary URL (for DB-stored absolute URLs). */
export function optimizeCloudinaryImageUrl(
  url: string,
  width: number,
  quality = 80,
): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (/\/upload\/[^/]*w_\d+/.test(url)) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_${quality},w_${width},c_limit/`,
  );
}

/** Pre-built Cloudinary URL for Server Components (cannot pass loader functions to Image). */
export function buildCloudinaryUrl(
  src: string,
  width: number,
  quality?: number,
): string {
  return cloudinaryLoader({ src, width, quality });
}

export const siLoader = ({ src }: ImageLoaderProps) => {
  return `https://cdn.simpleicons.org/${src}`;
};

/** Resolves a skill icon stored as a Simple Icons slug or full URL. */
export function resolveSkillImageUrl(src: string): string {
  if (!src.trim()) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return siLoader({ src, width: 32 });
}
