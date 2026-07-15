"use client";

import { motion } from "motion/react";
import Image from "next/image";

interface HeroData {
  fullName: string;
  photoUrl: string;
  imageAlt: string;
}

interface HeroPhotoProps {
  heroData: HeroData;
}

export default function HeroPhoto({ heroData }: HeroPhotoProps) {
  const { fullName, photoUrl, imageAlt } = heroData;

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative flex flex-1 justify-center lg:justify-end"
    >
      <div className="relative flex h-64 w-64 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary-700 ring-8 ring-primary/30 shadow-[0_0_50px_-10px_var(--primary)] md:h-80 md:w-80">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={imageAlt}
            width={400}
            height={400}
            className="absolute left-1/2 top-0 h-[150%] w-auto max-w-none -translate-x-1/2 object-cover transition-transform duration-500 hover:scale-105"
            priority
          />
        ) : (
          <span className="font-display text-6xl font-bold text-primary-foreground/90 md:text-7xl">
            {firstName.charAt(0).toUpperCase()}
            {lastName ? lastName.charAt(0).toUpperCase() : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
}
