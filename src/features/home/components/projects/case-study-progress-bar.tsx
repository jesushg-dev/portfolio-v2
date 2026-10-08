"use client";

import { useEffect, useState } from "react";

export function CaseStudyProgressBar() {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const progress = Math.min(
        1,
        window.scrollY / Math.max(documentHeight - viewportHeight, 1),
      );
      setReadingProgress(progress);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="bg-primary pointer-events-none fixed inset-x-0 top-0 z-50 h-1 origin-left transform-gpu transition-transform duration-150 motion-reduce:transition-none"
      style={{ transform: `scaleX(${readingProgress})` }}
    />
  );
}
