"use client";

import { useEffect, useState } from "react";

const SPOTIFY_FALLBACK = "#191414";
// Only used if a palette genuinely has zero swatches (corrupt/blank image) —
// mirrors the original module's hardcoded internal fallback color.
const DEFAULT_ACCENT: Rgb = { r: 30, g: 215, b: 96 };

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Swatch extends Rgb {
  population: number;
}

interface ColorTarget {
  minSaturation: number;
  targetSaturation: number;
  maxSaturation: number;
  minLightness: number;
  targetLightness: number;
  maxLightness: number;
}

export interface AlbumPalette {
  /** Saturated, eye-catching accent. Can legitimately land on a small feature (an outfit, a logo). */
  vibrant: string;
  /** Softer, more representative tone at similar lightness to vibrant. */
  muted: string;
  /** Saturated and dark — matches Spotify's own full-bleed "Now Playing" background closely. */
  darkVibrant: string;
  /** The single most common color in the image, whatever its saturation. */
  dominant: string;
}

// --- Small math helpers ----------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        break;
      case gn:
        h = ((bn - rn) / d + 2) / 6;
        break;
      default:
        h = ((rn - gn) / d + 4) / 6;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = (((h % 360) + 360) % 360) / 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  if (sat === 0) {
    const v = Math.round(light * 255);
    return { r: v, g: v, b: v };
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const channel = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  return {
    r: Math.round(channel(hue + 1 / 3) * 255),
    g: Math.round(channel(hue) * 255),
    b: Math.round(channel(hue - 1 / 3) * 255),
  };
}

// --- Hex helpers -------------------------------------------------------------

function toHex({ r, g, b }: Rgb): string {
  const byte = (c: number) =>
    clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0");
  return `#${byte(r)}${byte(g)}${byte(b)}`;
}

/** Re-lights a hex color to an absolute HSL lightness, keeping its hue/saturation. */
function withLightness(hex: string, targetLightness: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const { h, s } = rgbToHsl(r, g, b);
  return toHex(hslToRgb(h, s, targetLightness));
}

// --- Palette extraction ------------------------------------------------------
// Pixels are grouped into color buckets and counted, so the palette reflects
// how much of the image each color actually covers — a lone saturated pixel
// (a sequin, a lip) can no longer outrank a color that fills half the cover.

const BUCKET_SIZE = 24;

function bucketChannel(value: number): number {
  return Math.round(value / BUCKET_SIZE) * BUCKET_SIZE;
}

function buildPalette(imageData: ImageData): Swatch[] {
  const { data } = imageData;
  const buckets = new Map<
    string,
    { rSum: number; gSum: number; bSum: number; count: number }
  >();

  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] ?? 255) < 125) continue; // skip near-transparent pixels

    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const key = `${bucketChannel(r)},${bucketChannel(g)},${bucketChannel(b)}`;

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.rSum += r;
      bucket.gSum += g;
      bucket.bSum += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { rSum: r, gSum: g, bSum: b, count: 1 });
    }
  }

  return Array.from(buckets.values()).map(({ rSum, gSum, bSum, count }) => ({
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
    population: count,
  }));
}

// --- Target-based swatch selection (Android Palette / vibrant.js style) -----

const TARGET_VIBRANT: ColorTarget = {
  minSaturation: 35,
  targetSaturation: 100,
  maxSaturation: 100,
  minLightness: 30,
  targetLightness: 50,
  maxLightness: 70,
};

const TARGET_MUTED: ColorTarget = {
  minSaturation: 0,
  targetSaturation: 20,
  maxSaturation: 40,
  minLightness: 30,
  targetLightness: 50,
  maxLightness: 70,
};

const TARGET_DARK_VIBRANT: ColorTarget = {
  minSaturation: 35,
  targetSaturation: 100,
  maxSaturation: 100,
  minLightness: 0,
  targetLightness: 26,
  maxLightness: 45,
};

// A cluster below this share of sampled pixels is treated as noise — without
// this floor, "Vibrant" can lock onto a two-pixel compression artifact.
const MIN_POPULATION_SHARE = 0.01;

function proximity(
  value: number,
  target: number,
  min: number,
  max: number,
): number {
  const range = value > target ? max - target : target - min;
  if (range <= 0) return value === target ? 1 : 0;
  return clamp(1 - Math.abs(value - target) / range, 0, 1);
}

function scoreSwatch(
  swatch: Swatch,
  target: ColorTarget,
  maxPopulation: number,
): number | null {
  const { s, l } = rgbToHsl(swatch.r, swatch.g, swatch.b);

  if (
    l < target.minLightness ||
    l > target.maxLightness ||
    s < target.minSaturation ||
    s > target.maxSaturation
  ) {
    return null;
  }

  const saturationScore = proximity(
    s,
    target.targetSaturation,
    target.minSaturation,
    target.maxSaturation,
  );
  const lightnessScore = proximity(
    l,
    target.targetLightness,
    target.minLightness,
    target.maxLightness,
  );
  const populationScore =
    maxPopulation > 0 ? swatch.population / maxPopulation : 0;

  // Population carries the most weight: a small saturated patch shouldn't
  // outrank a color that actually fills most of the cover.
  return (
    saturationScore * 0.24 + lightnessScore * 0.24 + populationScore * 0.52
  );
}

function bestForTarget(
  palette: Swatch[],
  target: ColorTarget,
): Swatch | undefined {
  const totalPopulation = palette.reduce((sum, sw) => sum + sw.population, 0);
  const maxPopulation = palette.reduce(
    (max, sw) => Math.max(max, sw.population),
    0,
  );
  const minPopulation = totalPopulation * MIN_POPULATION_SHARE;

  let best: Swatch | undefined;
  let bestScore = -Infinity;

  for (const swatch of palette) {
    if (swatch.population < minPopulation) continue;
    const score = scoreSwatch(swatch, target, maxPopulation);
    if (score !== null && score > bestScore) {
      bestScore = score;
      best = swatch;
    }
  }

  return best;
}

function mostPopulous(palette: Swatch[]): Swatch | undefined {
  return palette.reduce<Swatch | undefined>(
    (best, sw) => (!best || sw.population > best.population ? sw : best),
    undefined,
  );
}

function buildAlbumPalette(swatches: Swatch[]): AlbumPalette {
  const dominant = mostPopulous(swatches) ?? DEFAULT_ACCENT;
  const dominantHex = toHex(dominant);

  const vibrant = bestForTarget(swatches, TARGET_VIBRANT);
  const muted = bestForTarget(swatches, TARGET_MUTED);
  const darkVibrant = bestForTarget(swatches, TARGET_DARK_VIBRANT);

  return {
    vibrant: vibrant ? toHex(vibrant) : dominantHex,
    muted: muted ? toHex(muted) : dominantHex,
    darkVibrant: darkVibrant ? toHex(darkVibrant) : dominantHex,
    dominant: dominantHex,
  };
}

// --- Public color utilities ---------------------------------------------------

export const SPOTIFY_PLAYER_BASE = SPOTIFY_FALLBACK;

/** Solid accent wash over the dark base (hex + alpha). */
export function buildSpotifyAccentOverlay(hex: string, alpha = 0.4): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

/**
 * Pins the gradient to the narrow, consistently-dark lightness band (~18-24%)
 * that Spotify's own "Now Playing" background actually sits in, instead of
 * multiplying RGB by a fixed percentage (which over- or under-darkens
 * depending on the input's own lightness). Feed this `palette.darkVibrant`,
 * not a mid-tone swatch — see useAlbumPalette below.
 */
export function buildSpotifyFullscreenBg(hex: string): string {
  const base = withLightness(hex, 18);
  const deep = withLightness(hex, 24);
  return `linear-gradient(180deg, ${base} 0%, ${deep} 100%)`;
}

// --- Extraction + hooks --------------------------------------------------------

const FALLBACK_PALETTE: AlbumPalette = {
  vibrant: SPOTIFY_FALLBACK,
  muted: SPOTIFY_FALLBACK,
  darkVibrant: SPOTIFY_FALLBACK,
  dominant: SPOTIFY_FALLBACK,
};

async function extractPaletteFromUrl(url: string): Promise<AlbumPalette> {
  const fallback = toHex(DEFAULT_ACCENT);
  const fallbackPalette: AlbumPalette = {
    vibrant: fallback,
    muted: fallback,
    darkVibrant: fallback,
    dominant: fallback,
  };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 100;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(fallbackPalette);
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      resolve(buildAlbumPalette(buildPalette(imageData)));
    };

    img.onerror = () => resolve(fallbackPalette);
    img.src = url;
  });
}

/** Full 4-swatch palette — pick whichever member fits the surface you're styling. */
export function useAlbumPalette(imageUrl: string | undefined): AlbumPalette {
  const [palette, setPalette] = useState<AlbumPalette>(FALLBACK_PALETTE);

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;

    void extractPaletteFromUrl(imageUrl).then((result) => {
      if (!cancelled) setPalette(result);
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return imageUrl ? palette : FALLBACK_PALETTE;
}
