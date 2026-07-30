"use client";

import { useEffect, useState } from "react";

const SPOTIFY_FALLBACK = "#191414";

interface Rgb {
  r: number;
  g: number;
  b: number;
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

function extractVibrantColor(imageData: ImageData): Rgb {
  const { data } = imageData;
  let bestScore = -1;
  let bestColor: Rgb = { r: 30, g: 215, b: 96 };

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const { s, l } = rgbToHsl(r, g, b);

    if (l < 12 || l > 88) continue;

    const score = s * (1 - Math.abs(l - 45) / 55);
    if (score > bestScore) {
      bestScore = score;
      bestColor = { r, g, b };
    }
  }

  return bestColor;
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function darkenHex(hex: string, amount: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const mix = (channel: number) =>
    Math.max(0, Math.floor(channel * (1 - amount)));

  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export const SPOTIFY_PLAYER_BASE = SPOTIFY_FALLBACK;

/** Solid accent wash over the dark base (hex + alpha). */
export function buildSpotifyAccentOverlay(hex: string, alpha = 0.4): string {
  const clamped = Math.min(1, Math.max(0, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

export function buildSpotifyFullscreenBg(hex: string): string {
  const base = darkenHex(hex, 0.55);
  const deep = darkenHex(hex, 0.72);
  return `linear-gradient(180deg, ${base} 0%, ${deep} 100%)`;
}

async function extractColorFromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 64;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(SPOTIFY_FALLBACK);
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      resolve(toHex(extractVibrantColor(imageData)));
    };

    img.onerror = () => resolve(SPOTIFY_FALLBACK);
    img.src = url;
  });
}

export function useAlbumColor(imageUrl: string | undefined) {
  const [accentColor, setAccentColor] = useState(SPOTIFY_FALLBACK);

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;

    void extractColorFromUrl(imageUrl).then((color) => {
      if (!cancelled) setAccentColor(color);
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return imageUrl ? accentColor : SPOTIFY_FALLBACK;
}
