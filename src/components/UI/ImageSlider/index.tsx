import React, { useState, useEffect } from "react";
import type { ImageLoader } from "next/image";
import Image from "next/image";
import { motion } from "framer-motion";

interface ImageSliderProps {
  images: string[];
  interval: number;
  loader?: ImageLoader;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  interval,
  loader,
  className,
  width,
  height,
  alt,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Calculate the index of the next image
      const nextImageIndex = (currentImageIndex + 1) % images.length;
      setCurrentImageIndex(nextImageIndex);
    }, interval);

    // Cleanup the interval when the component is unmounted
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
      <Image
        src={images[currentImageIndex]}
        alt={alt || "ImageSlider's image"}
        width={width}
        height={height}
        loader={loader}
        className={className}
      />
    </motion.div>
  );
};

export default ImageSlider;
