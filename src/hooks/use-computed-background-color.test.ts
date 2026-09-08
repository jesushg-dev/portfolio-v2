import { renderHook } from "@testing-library/react";

import { ETheme } from "@/utils/constants/theme";

import useComputedBackgroundColor from "./use-computed-background-color";

describe("useComputedBackgroundColor", () => {
  it("returns a ref and the computed background color", () => {
    const { result } = renderHook(() =>
      useComputedBackgroundColor(ETheme.MAIN_DARK),
    );
    expect(result.current[0]).toBeDefined();
    expect(typeof result.current[1]).toBe("string");
  });
});
