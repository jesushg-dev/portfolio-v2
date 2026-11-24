"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useBodyOverlayLock } from "@/hooks/use-body-overlay-lock";
import { IOSDeviceMockup, IOSHomeBar } from "@/components/shared/ios-device";
import { IOSDeviceCanvas } from "@/components/shared/ios-device/ios-device-canvas";
import { IOSDeviceRotationControl } from "./ios-device-rotation-control";
import type { PhoneProfile, PhoneRenderer } from "./ios-device-renderer";
import { TRPCReactProvider } from "@/trpc/react";
import { useLiveWeather } from "./hooks/use-live-weather";
import styles from "./hero-phone.module.css";

const loadSpotifyMiniApp = () =>
  import("@/components/shared/ios-device/apps/spotify/spotify-mini-app");

function preloadSpotify(): void {
  void loadSpotifyMiniApp();
}

const SpotifyMiniApp = dynamic(loadSpotifyMiniApp, { ssr: false });

function HeroSpotifyScreen({ onClose }: { onClose: () => void }) {
  const t = useTranslations("global.footer");
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    screenRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={screenRef}
      className={styles.miniApp}
      role="region"
      aria-label="Spotify"
      data-hero-mini-app
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

function IOSHeroDeviceContent({
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
  const canInspectRef = useRef(false);

  const [unitOverride, setUnitOverride] = useState<"C" | "F" | null>(null);

  const rawWeather = useLiveWeather(
    profile.locale,
    profile.location?.split(",")[0]?.trim() ?? "Managua",
  );
  const liveWeather = useMemo(() => {
    if (!unitOverride || rawWeather.unit === unitOverride) return rawWeather;
    const toC = unitOverride === "C";
    const convert = (t: number) =>
      toC ? Math.round(((t - 32) * 5) / 9) : Math.round((t * 9) / 5 + 32);

    return {
      ...rawWeather,
      unit: unitOverride,
      temperature: convert(rawWeather.temperature),
      high: convert(rawWeather.high),
      low: convert(rawWeather.low),
      hourly: rawWeather.hourly?.map((h) => ({
        ...h,
        temp: convert(h.temp),
      })),
    };
  }, [rawWeather, unitOverride]);
  const activeProfile = useMemo(
    () => ({
      ...profile,
      weather: liveWeather,
    }),
    [profile, liveWeather],
  );
  const activeProfileRef = useRef(activeProfile);
  const modelRef = useRef<PhoneRenderer | null>(null);

  useEffect(() => {
    activeProfileRef.current = activeProfile;
    if (modelRef.current) {
      modelRef.current.updateProfile?.(activeProfile);
    }
  }, [activeProfile]);

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

  useBodyOverlayLock(spotifyOpen);

  // Preload Spotify bundle in the background during idle time for instantaneous opening
  useEffect(() => {
    if (typeof window === "undefined") return;
    const preload = () => {
      void loadSpotifyMiniApp();
    };
    if ("requestIdleCallback" in window) {
      const win = window as Window & {
        requestIdleCallback: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      const handle = win.requestIdleCallback(preload, { timeout: 2500 });
      return () => win.cancelIdleCallback?.(handle);
    }
    const timer = setTimeout(preload, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!spotifyOpen) return;
    const restoreFocus = launcher.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) closeSpotify();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
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
            story.clientHeight * 0.55,
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
      if (canInspectRef.current !== inspect) {
        canInspectRef.current = inspect;
        setCanInspect(inspect);
      }
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
              activeProfileRef.current,
            );
            modelRef.current = model;
          } catch {
            model = null;
            modelRef.current = null;
          }
          resolved = true;
          story!.dataset.render = model ? "webgl" : "fallback";
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
      model?.dispose();
      model = null;
      modelRef.current = null;
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
      model?.dispose();
      modelRef.current = null;
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
                  onMouseEnter={preloadSpotify}
                  onFocus={preloadSpotify}
                  hidden={spotifyOpen}
                  title="Open Spotify"
                >
                  <span className="sr-only">Spotify</span>
                </button>
                {!spotifyOpen && (
                  <>
                    <a
                      href="#skills"
                      className={styles.terminalApp}
                      title="Terminal / Skills"
                    >
                      <span className="sr-only">Terminal</span>
                    </a>
                    <a
                      href="#portfolio"
                      className={styles.projectsApp}
                      title="Projects & Case Studies"
                    >
                      <span className="sr-only">Projects</span>
                    </a>
                    <a
                      href="#experience"
                      className={styles.cvApp}
                      title="Experience & CV"
                    >
                      <span className="sr-only">CV</span>
                    </a>
                    <a
                      href="#blog"
                      className={styles.blogApp}
                      title="Blog & Articles"
                    >
                      <span className="sr-only">Blog</span>
                    </a>
                    <a
                      href="https://github.com/jesushg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.codeApp}
                      title="GitHub Profile"
                    >
                      <span className="sr-only">Code</span>
                    </a>
                    <a
                      href="https://linkedin.com/in/jesushg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedInApp}
                      title="LinkedIn Profile"
                    >
                      <span className="sr-only">LinkedIn</span>
                    </a>
                    <a
                      href="#contact"
                      className={styles.mailApp}
                      title="Contact Jesús"
                    >
                      <span className="sr-only">Mail</span>
                    </a>
                    <a
                      href="#experience"
                      className={styles.profileWidgetApp}
                      title="Profile Highlights"
                    >
                      <span className="sr-only">Profile Highlights</span>
                    </a>
                    <button
                      type="button"
                      className={styles.weatherWidgetApp}
                      onClick={() => {
                        setUnitOverride((prev) =>
                          (prev ?? liveWeather.unit) === "C" ? "F" : "C",
                        );
                      }}
                      title={`Toggle Weather Unit (°${(unitOverride ?? liveWeather.unit) === "C" ? "F" : "C"})`}
                    >
                      <span className="sr-only">Toggle Weather Unit</span>
                    </button>
                  </>
                )}
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
                    onMouseEnter={preloadSpotify}
                    onFocus={preloadSpotify}
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
                    <small>{profile.circuitSubtitle ?? "REST · GraphQL"}</small>
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

export function IOSHeroDevice(props: IOSHeroDeviceProps) {
  return (
    <TRPCReactProvider>
      <IOSHeroDeviceContent {...props} />
    </TRPCReactProvider>
  );
}
