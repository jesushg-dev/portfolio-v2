import { ImageLoaderProps } from 'next/image';

const cloudinaryLoader = ({ width, src, quality }: ImageLoaderProps) => {
  const qualityString = quality ? ',q_' + quality : '';
  return `https://res.cloudinary.com/js-media/image/upload/w_${width}${qualityString},c_limit/v1642524352/portfolio/${src}`;
};

const siLoader = ({ src }: ImageLoaderProps) => {
  return `https://cdn.simpleicons.org/${src}`;
};

export { cloudinaryLoader, siLoader };
