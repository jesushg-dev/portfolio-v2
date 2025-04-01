import type { ETheme } from "@/utils/constants/theme";
import type { RefObject } from "react";
import { useState, useEffect, useRef } from "react";

const useComputedBackgroundColor = (
  theme: ETheme,
): [RefObject<HTMLDivElement | null>, string] => {
  const ref = useRef<HTMLDivElement>(null);
  const [fillColor, setFillColor] = useState<string>("");

  useEffect(() => {
    if (ref.current) {
      const computedColor = getComputedStyle(ref.current).backgroundColor;
      setFillColor(computedColor);
    }
  }, [ref, theme]); // Spread the dependencies into the dependency array

  return [ref, fillColor];
};

export default useComputedBackgroundColor;
