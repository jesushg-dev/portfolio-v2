"use client";

import { useEffect, useRef } from "react";
import { IOSDeviceCanvas } from "./ios-device-canvas";
import type { PhoneRenderer } from "./ios-device-renderer";
import { observeDeviceScreen } from "./ios-device-screen-texture";
import styles from "./ios-device-mockup.module.css";

export function IOSDeviceChassisCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = canvas?.parentElement;
    if (!canvas || !frame || typeof WebGLRenderingContext === "undefined")
      return;

    let mounted = true;
    let renderer: PhoneRenderer | null = null;
    let stopScreen: (() => void) | undefined;
    let readyFrame = 0;

    function load() {
      void import("./ios-device-renderer").then(({ createDeviceChassis }) => {
        if (!mounted || renderer) return;
        try {
          renderer = createDeviceChassis(canvas!, frame!);
        } catch {
          renderer = null;
        }
        if (!renderer) return;
        renderer.vis(true);
        stopScreen = observeDeviceScreen(frame!, renderer);
        readyFrame = requestAnimationFrame(() => {
          if (renderer) canvas!.dataset.deviceModel = "webgl";
        });
      });
    }

    function unload(event?: Event) {
      event?.preventDefault();
      cancelAnimationFrame(readyFrame);
      stopScreen?.();
      stopScreen = undefined;
      renderer?.dispose();
      renderer = null;
      delete canvas!.dataset.deviceModel;
    }

    const resize = new ResizeObserver(() => renderer?.set(0));
    resize.observe(frame);
    load();
    canvas.addEventListener("webglcontextlost", unload);
    canvas.addEventListener("webglcontextrestored", load);
    return () => {
      mounted = false;
      unload();
      resize.disconnect();
      canvas.removeEventListener("webglcontextlost", unload);
      canvas.removeEventListener("webglcontextrestored", load);
    };
  }, []);

  return (
    <IOSDeviceCanvas
      ref={canvasRef}
      className={styles.model}
      aria-hidden="true"
    />
  );
}
