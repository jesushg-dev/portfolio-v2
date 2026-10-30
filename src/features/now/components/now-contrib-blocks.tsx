"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Move, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  blockColors,
  contributionCells,
  contributionLabel,
} from "../lib/contribution-visuals";
import { initialContributionCamera } from "../lib/contribution-camera";
import type { ContributionCamera } from "../lib/contribution-camera";
import {
  containsPoint,
  drawContributionScene,
} from "../lib/draw-contribution-scene";
import type { BlockPalette } from "../lib/draw-contribution-scene";
import type { ReadyGitHubContributions } from "../lib/github-contributions";

interface CameraDrag {
  pointerId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  camera: ContributionCamera;
  pan: boolean;
}
export default function NowContribBlocks({
  calendar,
}: {
  calendar: ReadyGitHubContributions;
}) {
  const locale = useLocale();
  const t = useTranslations("main.now.activity");
  const canvas = useRef<HTMLCanvasElement>(null);
  const colors = useRef<HTMLDivElement>(null);
  const camera = useRef({ ...initialContributionCamera });
  const drag = useRef<CameraDrag | null>(null);
  const queueDraw = useRef<() => void>(() => {
    /**/
  });
  const scene = useRef<ReturnType<typeof drawContributionScene>>([]);
  const [pan, setPan] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const cells = useMemo(
    () => contributionCells(calendar.weeks),
    [calendar.weeks],
  );
  const labels = useMemo(
    () =>
      new Map(
        cells.map((day) => [
          day.date,
          t("contributionDay", {
            count: day.count,
            date: contributionLabel(day, locale),
          }),
        ]),
      ),
    [cells, locale, t],
  );

  useEffect(() => {
    const element = canvas.current;
    const paletteElement = colors.current;
    if (!element || !paletteElement) return;
    let frame = 0;
    let palette: BlockPalette[] = [];
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scene.current = drawContributionScene(
          element,
          cells,
          calendar.weeks.length,
          camera.current,
          palette,
        );
      });
    };
    const readColors = () => {
      palette = Array.from(paletteElement.children, (group) => {
        const values = Array.from(
          group.children,
          (child) => getComputedStyle(child).color,
        );
        return {
          top: values[0],
          side: values[1],
          front: values[2],
          stud: values[3],
        };
      });
      schedule();
    };
    const resize = () => {
      const rect = element.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio, 2);
      element.width = Math.max(1, Math.round(rect.width * ratio));
      element.height = Math.max(1, Math.round(rect.height * ratio));
      schedule();
    };
    queueDraw.current = schedule;
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const theme = new MutationObserver(readColors);
    theme.observe(document.documentElement, { attributes: true });
    theme.observe(document.body, { attributes: true });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", readColors);
    readColors();
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      theme.disconnect();
      media.removeEventListener("change", readColors);
      queueDraw.current = () => {
        /**/
      };
    };
  }, [cells, calendar.weeks.length]);

  const updateCamera = (
    change: (current: ContributionCamera) => ContributionCamera,
  ) => {
    camera.current = change(camera.current);
    queueDraw.current();
  };
  const zoom = (delta: number) =>
    updateCamera((current) => ({
      ...current,
      zoom: Math.max(0.6, Math.min(2.5, current.zoom + delta)),
    }));
  const reset = () => {
    updateCamera(() => ({ ...initialContributionCamera }));
    setPan(false);
    setHoveredDate(null);
  };
  const endDrag = (event: PointerEvent<HTMLCanvasElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return (
    <figure className="min-w-0">
      <div aria-hidden ref={colors} className="hidden">
        {blockColors.map((color) => (
          <span key={color}>
            <span style={{ color }} />
            <span
              style={{
                color: `color-mix(in srgb, ${color}, var(--foreground) 22%)`,
              }}
            />
            <span
              style={{
                color: `color-mix(in srgb, ${color}, var(--foreground) 10%)`,
              }}
            />
            <span
              style={{
                color: `color-mix(in srgb, ${color}, var(--background) 18%)`,
              }}
            />
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("rotateBlocks")}
          onClick={() =>
            updateCamera((current) => ({ ...current, yaw: current.yaw + 15 }))
          }
        >
          <RotateCw aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("panBlocks")}
          aria-pressed={pan}
          onClick={() => setPan((value) => !value)}
        >
          <Move aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("zoomInBlocks")}
          onClick={() => zoom(0.2)}
        >
          <ZoomIn aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t("zoomOutBlocks")}
          onClick={() => zoom(-0.2)}
        >
          <ZoomOut aria-hidden />
        </Button>
        <Button type="button" variant="ghost" onClick={reset}>
          <RotateCcw aria-hidden />
          {t("resetBlocks")}
        </Button>
      </div>
      <canvas
        ref={canvas}
        width={1000}
        height={600}
        className={cn(
          "focus-visible:ring-ring mx-auto block aspect-[5/3] h-auto w-full rounded-lg outline-none focus-visible:ring-2",
          pan
            ? "cursor-move touch-none"
            : "cursor-grab touch-pan-y active:cursor-grabbing",
        )}
        role="img"
        tabIndex={0}
        aria-label={t("blocksDescription")}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          drag.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            width: rect.width,
            height: rect.height,
            camera: { ...camera.current },
            pan: pan || event.shiftKey,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (!start) {
            const rect = event.currentTarget.getBoundingClientRect();
            const x =
              ((event.clientX - rect.left) * 1000) / Math.max(1, rect.width);
            const y =
              ((event.clientY - rect.top) * 600) / Math.max(1, rect.height);
            let hit: string | null = null;
            for (let index = scene.current.length - 1; index >= 0; index--) {
              const block = scene.current[index];
              if (
                containsPoint(block.top, x, y) ||
                containsPoint(block.sideX, x, y) ||
                containsPoint(block.sideY, x, y)
              ) {
                hit = block.day.date;
                break;
              }
            }
            setHoveredDate(hit);
            return;
          }
          if (start.pointerId !== event.pointerId) return;
          const dx = (event.clientX - start.x) / Math.max(1, start.width);
          const dy = (event.clientY - start.y) / Math.max(1, start.height);
          updateCamera(() =>
            start.pan
              ? {
                  ...start.camera,
                  panX: Math.max(
                    -700,
                    Math.min(700, start.camera.panX + dx * 1000),
                  ),
                  panY: Math.max(
                    -400,
                    Math.min(400, start.camera.panY + dy * 600),
                  ),
                }
              : {
                  ...start.camera,
                  yaw: start.camera.yaw + dx * 180,
                  pitch: Math.max(
                    15,
                    Math.min(75, start.camera.pitch - dy * 90),
                  ),
                },
          );
        }}
        onPointerLeave={() => setHoveredDate(null)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
        onKeyDown={(event) => {
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "+",
              "=",
              "-",
              "Home",
            ].includes(event.key)
          )
            return;
          event.preventDefault();
          if (event.key === "+" || event.key === "=") zoom(0.2);
          else if (event.key === "-") zoom(-0.2);
          else if (event.key === "Home") reset();
          else
            updateCamera((current) => ({
              ...current,
              yaw:
                current.yaw +
                (event.key === "ArrowLeft"
                  ? -10
                  : event.key === "ArrowRight"
                    ? 10
                    : 0),
              pitch: Math.max(
                15,
                Math.min(
                  75,
                  current.pitch +
                    (event.key === "ArrowUp"
                      ? 5
                      : event.key === "ArrowDown"
                        ? -5
                        : 0),
                ),
              ),
            }));
        }}
      >
        {t("blocksDescription")}
      </canvas>
      <p className="text-muted-foreground min-h-5 text-center text-xs">
        {hoveredDate ? labels.get(hoveredDate) : "\u00a0"}
      </p>
      <figcaption className="text-muted-foreground flex flex-wrap items-center justify-center gap-2 text-xs">
        <span>{t("less")}</span>
        {blockColors.map((color) => (
          <span
            key={color}
            className="size-3 rounded-xs"
            style={{ backgroundColor: color }}
          />
        ))}
        <span>{t("more")}</span>
        <span className="basis-full text-center">{t("blocksHint")}</span>
      </figcaption>
    </figure>
  );
}
