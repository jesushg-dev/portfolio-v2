"use client";

import { useEffect, useRef, useState } from "react";

interface Metric {
  label: string;
  value: string;
  icon?: string;
}

interface MetricsBarProps {
  metrics: Metric[];
}

function AnimatedNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(value);

  useEffect(() => {
    const numericMatch = /^([+-]?)(\d+)/.exec(value);
    if (!numericMatch) return;

    const prefix = numericMatch[1];
    const target = parseInt(numericMatch[2], 10);
    const suffix = value.slice(numericMatch[0].length);
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplayed(`${prefix}${current}${suffix}`);
      if (progress < 1) requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{displayed}</span>;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="border-border bg-card rounded-xl border p-5 text-center"
        >
          {metric.icon && (
            <span className="mb-2 block text-2xl">{metric.icon}</span>
          )}
          <p className="text-primary text-2xl font-bold tracking-tight md:text-3xl">
            <AnimatedNumber value={metric.value} />
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}
