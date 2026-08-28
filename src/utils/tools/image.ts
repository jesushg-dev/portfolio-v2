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
  quality: number | string = 80,
): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (/\/upload\/[^/]*w_\d+/.test(url)) {
    return url;
  }

  const qualityTransform =
    typeof quality === "number" ? `q_${quality}` : `q_${quality}`;

  return url.replace(
    "/upload/",
    `/upload/f_auto,${qualityTransform},w_${width},c_limit/`,
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

export function isAbsoluteOrLocalImagePath(src: string): boolean {
  const trimmed = src.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  );
}

/** Cloudinary public id vs absolute/local path — both are valid for next/image. */
export function isRenderableProjectImage(
  src: string | null | undefined,
): boolean {
  const trimmed = src?.trim() ?? "";
  if (!trimmed) return false;
  if (isAbsoluteOrLocalImagePath(trimmed)) {
    if (trimmed.startsWith("/")) return true;
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

export function getProjectImageLoader(
  src: string,
): typeof cloudinaryLoader | undefined {
  return isAbsoluteOrLocalImagePath(src) ? undefined : cloudinaryLoader;
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
