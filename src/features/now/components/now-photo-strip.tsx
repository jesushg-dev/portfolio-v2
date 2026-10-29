"use client";
import { motion, useReducedMotion } from "motion/react";
import { MediaImage } from "@/components/shared/media-image";
const poses = [{ rotate: -3, y: 0.5 }, { rotate: 2, y: -0.5 }, { rotate: -2, y: 1 }];
export function NowPhotoStrip({ photos, alt }: { photos: string[]; alt: string }) {
  const reducedMotion = useReducedMotion();
  return <div className="grid grid-cols-3 gap-3 px-2 py-6 sm:gap-6 sm:px-3">
    {photos.map((url, index) => {
      const pose = poses[index % poses.length];
      return <motion.div key={url} initial={false}
        style={{ rotate: pose.rotate, y: String(pose.y) + "rem" }}
        whileHover={reducedMotion ? undefined : { rotate: 0, y: 0, scale: 1.025 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="bg-card relative aspect-[4/3] rounded-lg shadow-lg">
        <div className="relative size-full overflow-hidden rounded-lg">
          <MediaImage src={url} alt={alt} fill sizes="(max-width: 48rem) 30vw, 20rem" className="object-cover" />
        </div>
      </motion.div>;
    })}
  </div>;
}
