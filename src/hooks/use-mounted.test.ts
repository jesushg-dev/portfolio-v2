import { renderHook } from "@testing-library/react";

import { useMounted } from "./use-mounted";

describe("useMounted", () => {
  it("is true after client mount", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});
