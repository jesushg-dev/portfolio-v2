import { renderHook } from "@testing-library/react";
import { composeRefs, useComposedRefs } from "./compose-refs";

describe("compose-refs", () => {
  describe("composeRefs", () => {
    it("sets multiple ref objects and callback refs", () => {
      const refObj = { current: null };
      const callbackRef = jest.fn();

      const combined = composeRefs<string>(
        refObj,
        callbackRef,
        undefined,
        null,
      );
      combined("hello");

      expect(refObj.current).toBe("hello");
      expect(callbackRef).toHaveBeenCalledWith("hello");
    });

    it("handles cleanup callbacks returned from callback refs", () => {
      const cleanupFn = jest.fn();
      const callbackRefWithCleanup = jest.fn().mockReturnValue(cleanupFn);
      const normalRefObj = { current: null };

      const combined = composeRefs<string>(
        callbackRefWithCleanup,
        normalRefObj,
      );
      const returnedCleanup = combined("node");

      expect(typeof returnedCleanup).toBe("function");

      if (typeof returnedCleanup === "function") {
        returnedCleanup();
      }

      expect(cleanupFn).toHaveBeenCalled();
      expect(normalRefObj.current).toBeNull();
    });
  });

  describe("useComposedRefs", () => {
    it("returns a callback ref in a React component context", () => {
      const refObj = { current: null };
      const { result } = renderHook(() => useComposedRefs<string>(refObj));
      result.current("val");
      expect(refObj.current).toBe("val");
    });
  });
});
