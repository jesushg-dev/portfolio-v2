"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IOSDeviceMockup, IOSHomeBar } from "@/components/shared/ios-device";
import { IOSDeviceCanvas } from "@/components/shared/ios-device/ios-device-canvas";
import type { ContactPhoneProfile } from "./contact-scene";
import "./contact-scene.css";

export function IOSFoldableDevice({
  profile,
  children,
}: {
  profile: ContactPhoneProfile;
  children: ReactNode;
}) {
  const story = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const section = story.current;
    const surface = canvas.current;
    if (!section || !surface) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = matchMedia("(min-width:64rem)");
    let generation = 0;
    let dispose: (() => void) | undefined;
    let near = false;
    function reset() {
      generation++;
      dispose?.();
      dispose = undefined;
      delete section!.dataset.motion;
    }
    function mount() {
      reset();
      const current = generation;
      if (motion.matches || !desktop.matches || !near) return;
      void import("./contact-scene").then(({ mountContactScene }) => {
        if (current !== generation) return;
        section!.dataset.motion = "on";
        dispose = mountContactScene(section!, surface!, profile);
      });
    }
    const root = section.closest("[data-blog-contact-story]") ?? section;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (near === entry.isIntersecting) return;
        near = entry.isIntersecting;
        mount();
      },
      { rootMargin: "100% 0%" },
    );
    observer.observe(root);
    function onLoss(event: Event) {
      event.preventDefault();
      mount();
    }
    surface.addEventListener("webglcontextlost", onLoss);
    surface.addEventListener("webglcontextrestored", mount);
    motion.addEventListener("change", mount);
    desktop.addEventListener("change", mount);
    return () => {
      reset();
      observer.disconnect();
      motion.removeEventListener("change", mount);
      desktop.removeEventListener("change", mount);
      surface.removeEventListener("webglcontextlost", onLoss);
      surface.removeEventListener("webglcontextrestored", mount);
    };
  }, [profile]);
  return (
    <>
      <div ref={story} className="cstory">
        <div className="cs-head" aria-hidden="true" />
        <div className="cs-stage">
          <IOSDeviceMockup
            variant="foldable"
            className="cs-panel"
            screenClassName="cs-screen"
            bezel={<i className="cs-cam" aria-hidden="true" />}
          >
            <div className="cs-lock" aria-hidden="true" />
            <div className="cs-card">
              <div className="cs-bar" aria-hidden="true">
                <b>9:41</b>
                <span>▂▄▆ ▰</span>
              </div>
              {children}
              <IOSHomeBar className="cs-home" decorative />
            </div>
          </IOSDeviceMockup>
        </div>
      </div>
      <div
        className="cs-blog-links pointer-events-none fixed inset-0 z-40"
        hidden
      >
        <div data-leaf="left" />
        <div data-leaf="right" />
        <div data-leaf="lid" aria-hidden="true" />
      </div>
      <IOSDeviceCanvas
        ref={canvas}
        data-fold-canvas
        aria-hidden="true"
        className="invisible fixed inset-0 z-30 h-screen w-screen opacity-0"
      />
    </>
  );
}
