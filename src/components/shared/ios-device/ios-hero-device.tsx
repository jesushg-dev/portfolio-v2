"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { IOSDeviceMockup, IOSHomeBar } from "@/components/shared/ios-device";
import { IOSDeviceCanvas } from "@/components/shared/ios-device/ios-device-canvas";
import { observeDeviceScreen } from "@/components/shared/ios-device/ios-device-screen-texture";
import { IOSDeviceRotationControl } from "./ios-device-rotation-control";
import type { PhoneProfile, PhoneRenderer } from "./ios-device-renderer";
import styles from "./hero-phone.module.css";

const SpotifyMiniApp = dynamic(
  () => import("@/components/shared/ios-device/apps/spotify/spotify-mini-app"),
  { ssr: false },
);

function HeroSpotifyScreen({ onClose }: { onClose: () => void }) {
  const t = useTranslations("global.footer");
  return (
    <div
      className={styles.miniApp}
      role="region"
      aria-label="Spotify"
      data-hero-mini-app
      data-ios-texture-source
      tabIndex={-1}
    >
      <SpotifyMiniApp onClose={onClose} />
      <IOSHomeBar onSwipeUp={onClose} label={t("spotify.fullscreen.close")} />
    </div>
  );
}

const introTurnMs = 1080;
const homePose = 0.43;
const assembledPose = 0.95;

function smooth(start: number, end: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

interface IOSHeroDeviceProps {
  content: ReactNode;
  profile: PhoneProfile;
  rotateLabel: string;
  backdrop: ReactNode;
  staticPortrait: ReactNode;
}

export function IOSHeroDevice({
  content,
  profile,
  rotateLabel,
  backdrop,
  staticPortrait,
}: IOSHeroDeviceProps) {
  const track = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const appSurface = useRef<HTMLDivElement>(null);
  const appActive = useRef(false);
  const inspectionYaw = useRef<number | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(false);
  const [canInspect, setCanInspect] = useState(false);

  function rotatePhone(yaw: number) {
    inspectionYaw.current = yaw;
    const story = track.current;
    story?.style.setProperty("--inspection-yaw", `${yaw}rad`);
    story?.setAttribute("data-inspecting", "");
    story?.toggleAttribute("data-inspection-back", Math.cos(yaw) <= 0);
  }

  function openSpotify(event: MouseEvent<HTMLButtonElement>) {
    launcher.current = event.currentTarget;
    appActive.current = true;
    setSpotifyOpen(true);
  }

  const closeSpotify = useCallback(() => {
    appActive.current = false;
    setSpotifyOpen(false);
  }, []);

  useEffect(() => {
    if (!spotifyOpen) return;
    const previousOverflow = document.body.style.overflow;
    const restoreFocus = launcher.current;
    document.body.style.overflow = "hidden";
    track.current
      ?.querySelector<HTMLElement>("[data-hero-mini-app]")
      ?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) closeSpotify();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      restoreFocus?.focus({ preventScroll: true });
    };
  }, [closeSpotify, spotifyOpen]);

  useEffect(() => {
    const story = track.current;
    const surface = canvas.current;
    if (!story || !surface) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let model: PhoneRenderer | null = null;
    let stopScreen: (() => void) | undefined;
    let alive = true,
      visible = false,
      frame = 0;
    let introStartedAt: number | undefined;
    let resolved = false;
    let introComplete = false;
    let lastModelProgress = 0;
    function update() {
      if (!story || !visible) return;
      const progress = motion.matches
        ? 0
        : smooth(
            0,
            story.clientHeight * 0.27,
            -story.getBoundingClientRect().top,
          );
      const exiting = progress > 0;
      const now = performance.now();
      const elapsed = resolved ? now - (introStartedAt ??= now) : 0;
      introComplete ||= motion.matches || exiting || elapsed >= introTurnMs;
      const p = introComplete
        ? homePose + (assembledPose - homePose) * progress
        : homePose * (elapsed / introTurnMs);
      const inspect = resolved && !motion.matches && introComplete && !exiting;
      setCanInspect(inspect);
      if (!inspect) {
        inspectionYaw.current = null;
        story.style.removeProperty("--inspection-yaw");
        story.removeAttribute("data-inspecting");
        story.removeAttribute("data-inspection-back");
      }
      lastModelProgress = p;
      model?.set(p);
      if (!model) {
        const tear = smooth(0.55, 0.68, p) * (1 - smooth(0.8, 0.91, p));
        story.style.setProperty(
          "--flip",
          String(179 * (1 - smooth(0.15, 0.33, p)) - 12 * tear) + "deg",
        );
        story.style.setProperty("--tear", String(tear));
        story.dataset.screen = p < 0.33 ? "lock" : "apps";
      }
      if (resolved && !introComplete) schedule();
    }
    function schedule() {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
    }
    function preference() {
      model?.vis(visible && !motion.matches);
      schedule();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      preference();
    });
    observer.observe(story);
    function loadModel() {
      if (motion.matches || model) return;
      void Promise.all([
        import("./ios-device-renderer"),
        import("./hero-device-artwork"),
      ])
        .then(([{ createPhone }, { drawHeroScreen, drawHeroLayers }]) => {
          if (!alive || model || motion.matches) return;
          try {
            model = createPhone(
              {
                canvas: surface!,
                start: lastModelProgress,
                screen: drawHeroScreen,
                layers: drawHeroLayers,
                refreshInterval: 30_000,
                appSurface: appSurface.current,
                appOpen: () => appActive.current,
                inspectYaw: () => inspectionYaw.current,
                mode: (p: number) => (p < 0.33 ? 1 : 2),
                portraitImage: story!.querySelector<HTMLImageElement>(
                  `.${styles.staticPortrait} img`,
                ),
              },
              profile,
            );
          } catch {
            model = null;
          }
          resolved = true;
          story!.dataset.render = model ? "webgl" : "fallback";
          if (model && appSurface.current) {
            stopScreen = observeDeviceScreen(appSurface.current, model);
          }
          setHasWebGL(Boolean(model));
          preference();
        })
        .catch(() => {
          if (!alive || model || !story) return;
          resolved = true;
          story.dataset.render = "fallback";
          schedule();
        });
    }
    function onMotion() {
      if (motion.matches) closeSpotify();
      preference();
      loadModel();
    }
    function onLoss(event: Event) {
      event.preventDefault();
      stopScreen?.();
      stopScreen = undefined;
      model?.dispose();
      model = null;
      setHasWebGL(false);
      story!.dataset.render = "fallback";
      schedule();
    }
    loadModel();
    update();
    motion.addEventListener("change", onMotion);
    surface.addEventListener("webglcontextlost", onLoss);
    surface.addEventListener("webglcontextrestored", loadModel);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      alive = false;
      observer.disconnect();
      cancelAnimationFrame(frame);
      stopScreen?.();
      model?.dispose();
      motion.removeEventListener("change", onMotion);
      surface.removeEventListener("webglcontextlost", onLoss);
      surface.removeEventListener("webglcontextrestored", loadModel);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [closeSpotify, profile]);

  return (
    <div
      ref={track}
      className={styles.story}
      data-hero-story
      data-app-open={spotifyOpen}
    >
      <div className={styles.stage}>
        {backdrop}
        <div
          className={`${styles.grid} relative mx-auto grid h-full w-full items-center gap-10 px-4 sm:px-6 md:grid-cols-[1.1fr_1fr] lg:container lg:px-20`}
        >
          <div className={`${styles.copy} relative z-10 grid items-center`}>
            {content}
          </div>
          <IOSDeviceMockup
            variant="model"
            className={styles.visual}
            model={
              <IOSDeviceCanvas
                ref={canvas}
                className={styles.canvas}
                aria-hidden="true"
              />
            }
          >
            {canInspect && (
              <IOSDeviceRotationControl
                className={styles.rotationControl}
                label={rotateLabel}
                hidden={spotifyOpen}
                getYaw={() => inspectionYaw.current ?? 0}
                onRotate={rotatePhone}
              />
            )}
            <div className={styles.appLayer}>
              <div ref={appSurface} className={styles.appSurface} hidden>
                <button
                  type="button"
                  className={styles.spotifyApp}
                  onClick={openSpotify}
                  hidden={spotifyOpen}
                >
                  <span className="sr-only">Spotify</span>
                </button>
                {spotifyOpen && hasWebGL && (
                  <HeroSpotifyScreen onClose={closeSpotify} />
                )}
              </div>
            </div>
            <div className={styles.fallback}>
              <div className={styles.device}>
                <div className={styles.front}>
                  <button
                    type="button"
                    className={styles.spotifyFallback}
                    onClick={openSpotify}
                    hidden={spotifyOpen}
                  >
                    <span className="sr-only">Spotify</span>
                  </button>
                  {spotifyOpen && !hasWebGL && (
                    <HeroSpotifyScreen onClose={closeSpotify} />
                  )}
                </div>
                <i className={styles.back} aria-hidden="true" />
              </div>
              <div className={styles.exploded} aria-hidden="true">
                <i className={styles.partBack} />
                <i className={styles.circuit}>
                  <b>
                    {profile.circuitTitle ?? "FULLSTACK"}
                    <small>
                      {profile.circuitSubtitle ?? "REST · GraphQL"}
                    </small>
                  </b>
                </i>
                <i className={styles.partFront} />
              </div>
            </div>
            <div className={styles.staticPortrait}>{staticPortrait}</div>
          </IOSDeviceMockup>
        </div>
      </div>
    </div>
  );
}
