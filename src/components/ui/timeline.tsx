"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

export interface TimelineEntry {
  title: string;
  content: ReactNode;
}

interface TimelineProps {
  data: TimelineEntry[];
  className?: string;
}

export function Timeline({ data, className }: TimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const updateHeight = () => {
      if (ref.current) {
        setHeight(ref.current.getBoundingClientRect().height);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [data.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  if (data.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "text-foreground relative w-full font-sans md:px-10",
        className,
      )}
    >
      <div className="relative mx-auto max-w-7xl pb-20" ref={ref}>
        {data.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="flex justify-start pt-10 md:gap-10 md:pt-32"
          >
            <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:max-w-sm md:flex-row lg:max-w-sm">
              <div className="bg-background absolute left-3 flex h-10 w-10 items-center justify-center rounded-full md:left-3">
                <div className="bg-muted border-border h-4 w-4 rounded-full border p-2" />
              </div>
              <h3 className="text-muted-foreground hidden pl-20 text-xl font-bold md:block md:text-4xl lg:text-5xl">
                {item.title || "\u00A0"}
              </h3>
            </div>

            <div className="relative w-full pr-4 pl-20 md:pl-4">
              {item.title ? (
                <h3 className="text-muted-foreground mb-4 block text-left text-2xl font-bold md:hidden">
                  {item.title}
                </h3>
              ) : null}
              {item.content}
            </div>
          </div>
        ))}

        <div
          style={{ height: `${height}px` }}
          className="via-border absolute top-0 left-8 w-[2px] overflow-hidden bg-gradient-to-b from-transparent to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="from-primary via-primary/70 absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
