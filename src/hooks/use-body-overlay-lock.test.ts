import { act, renderHook } from "@testing-library/react";

import { useBodyOverlayLock, useBodyOverlayLocked } from "./use-body-overlay-lock";

describe("useBodyOverlayLock", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    delete document.body.dataset.overlayLock;
  });

  it("locks overflow while active and restores on unmount", () => {
    const { unmount } = renderHook(() => useBodyOverlayLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.dataset.overlayLock).toBe("true");
    unmount();
    expect(document.body.dataset.overlayLock).toBeUndefined();
  });

  it("does nothing when inactive", () => {
    renderHook(() => useBodyOverlayLock(false));
    expect(document.body.dataset.overlayLock).toBeUndefined();
  });
});

describe("useBodyOverlayLocked", () => {
  afterEach(() => {
    delete document.body.dataset.overlayLock;
  });

  it("reads the overlay lock dataset", () => {
    document.body.dataset.overlayLock = "true";
    const { result } = renderHook(() => useBodyOverlayLocked());
    expect(result.current).toBe(true);
  });
});
