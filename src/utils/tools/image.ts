import type { ImageLoaderProps } from "next/image";

export const cdFlagloader = (props: ImageLoaderProps) => {
  const { width, src, quality } = props;
  const qualityString = quality ? `,q_${quality}` : "";
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1673392016/language/${src}`;
};

export const cloudinaryLoader = (props: ImageLoaderProps) => {
  const { width, src, quality } = props;
  const qualityString = quality ? `,q_${quality}` : "";
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1642524352/portfolio/${src}`;
};

export const siLoader = ({ src }: ImageLoaderProps) => {
  return `https://cdn.simpleicons.org/${src}`;
};
