import { useState, useEffect, type FC } from "react";
import { motion } from "motion/react";

import { MediaImage } from "@/components/shared/media-image";

interface ImageSliderProps {
  images: string[];
  interval: number;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const ImageSlider: FC<ImageSliderProps> = ({
  images,
  interval,
  className,
  width,
  height,
  alt,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextImageIndex = (currentImageIndex + 1) % images.length;
      setCurrentImageIndex(nextImageIndex);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentImageIndex, images.length, interval]);

  return (
    <motion.div
      key={currentImageIndex}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MediaImage
        src={images[currentImageIndex]}
        alt={alt ?? "ImageSlider's image"}
        width={width}
        height={height}
        className={className}
      />
    </motion.div>
  );
};

export default ImageSlider;
