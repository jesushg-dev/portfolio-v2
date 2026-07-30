"use client";

import { useEffect, useSyncExternalStore } from "react";

function subscribeToOverlayLock(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-overlay-lock"],
  });
  return () => observer.disconnect();
}

function getOverlayLockedSnapshot() {
  return document.body.dataset.overlayLock === "true";
}

export function useBodyOverlayLocked() {
  return useSyncExternalStore(
    subscribeToOverlayLock,
    getOverlayLockedSnapshot,
    () => false,
  );
}

export function useBodyOverlayLock(active = true) {
  useEffect(() => {
    if (!active) return;

    const previousOverflow = document.body.style.overflow;
    const hadOverlayLock = document.body.dataset.overlayLock === "true";

    document.body.style.overflow = "hidden";
    document.body.dataset.overlayLock = "true";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (hadOverlayLock) {
        document.body.dataset.overlayLock = "true";
      } else {
        delete document.body.dataset.overlayLock;
      }
    };
  }, [active]);
}
