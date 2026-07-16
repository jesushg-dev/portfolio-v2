import { useCallback, type KeyboardEvent } from "react";

export function useTabsKeyboard(
  tabCount: number,
  activeIndex: number,
  onChange: (index: number) => void,
) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (tabCount <= 0) return;

      let nextIndex: number | null = null;

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (activeIndex - 1 + tabCount) % tabCount;
          break;
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (activeIndex + 1) % tabCount;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabCount - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      onChange(nextIndex);
    },
    [activeIndex, onChange, tabCount],
  );
}
