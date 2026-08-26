"use client";

import { useEffect, useState } from "react";

import { NOW_TIMEZONE_FALLBACK } from "../data";

interface NowLocalTimeProps {
  className?: string;
  timezone?: string;
}

export function NowLocalTime({ className, timezone }: NowLocalTimeProps) {
  const [time, setTime] = useState("--:--");
  const tz = timezone ?? NOW_TIMEZONE_FALLBACK;

  useEffect(() => {
    const format = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          timeZone: tz,
        }),
      );
    };

    format();
    const id = window.setInterval(format, 30_000);
    return () => window.clearInterval(id);
  }, [tz]);

  return (
    <time dateTime={time} className={className}>
      {time}
    </time>
  );
}
