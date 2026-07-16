"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { LoadingFixed } from "@/components/shared/loading";

const BgParticles = dynamic(() => import("./bg-particles"), {
  ssr: false,
  loading: () => <LoadingFixed />,
});

export default function DeferredBgParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      {shouldLoad ? <BgParticles /> : null}
    </div>
  );
}
