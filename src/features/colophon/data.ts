import { ETheme } from "@/utils/constants/theme";

export const COLOPHON_STACK = [
  { id: "nextjs", href: "https://nextjs.org", label: "Next.js" },
  { id: "tailwind", href: "https://tailwindcss.com", label: "Tailwind CSS" },
  { id: "prisma", href: "https://www.prisma.io", label: "Prisma" },
  { id: "mongodb", href: "https://www.mongodb.com", label: "MongoDB" },
  { id: "vercel", href: "https://vercel.com", label: "Vercel" },
] as const;

export const COLOPHON_WEIGHTS = [
  { id: "regular", className: "font-normal" },
  { id: "medium", className: "font-medium" },
  { id: "semibold", className: "font-semibold" },
  { id: "bold", className: "font-bold" },
] as const;

export interface ColophonPalette {
  id: ETheme;
  swatches: readonly string[];
}

/** Primary 50→900 scales from `globals.css` theme tokens. */
export const COLOPHON_PALETTES: readonly ColophonPalette[] = [
  {
    id: ETheme.ORANGE_LIGHT,
    swatches: [
      "#fff7ed",
      "#ffefd1",
      "#ffdfb1",
      "#ffce8f",
      "#ffbb6c",
      "#ffa948",
      "#ff9a29",
      "#ff8c0e",
      "#ff7d00",
      "#ff6e00",
    ],
  },
  {
    id: ETheme.MAIN_LIGHT,
    swatches: [
      "#eff7ff",
      "#dbeafe",
      "#bfd3fe",
      "#93c5fd",
      "#60a5fa",
      "#3b82f6",
      "#2563eb",
      "#1d4ed8",
      "#1e40af",
      "#1e3a8a",
    ],
  },
  {
    id: ETheme.MAIN_DARK,
    swatches: [
      "#0d1221",
      "#1b2346",
      "#29418e",
      "#365dc9",
      "#3b70e3",
      "#3c82f6",
      "#3c8eff",
      "#3480f4",
      "#2b6dc8",
      "#23519a",
    ],
  },
  {
    id: ETheme.ORANGE_DARK,
    swatches: [
      "#0d1221",
      "#1b2346",
      "#29418e",
      "#365dc9",
      "#3b70e3",
      "#ff8c00",
      "#ffa500",
      "#ff7f00",
      "#ff6600",
      "#ff4500",
    ],
  },
  {
    id: ETheme.CHRISTMAS_LIGHT,
    swatches: [
      "#ffeeee",
      "#fed7d7",
      "#feb2b2",
      "#fc8181",
      "#f56565",
      "#e53e3e",
      "#c53030",
      "#9b2c2c",
      "#822727",
      "#63171b",
    ],
  },
  {
    id: ETheme.CHRISTMAS_DARK,
    swatches: [
      "#ffeeee",
      "#fed7d7",
      "#feb2b2",
      "#fc8181",
      "#f56565",
      "#e53e3e",
      "#c53030",
      "#9b2c2c",
      "#822727",
      "#63171b",
    ],
  },
] as const;

export const COLOPHON_CARBON = {
  beaconHref: "https://digitalbeacon.co/report/jesushg-com",
  carbonHref: "https://www.websitecarbon.com/website/jesushg-com/",
  /** Rounded badge figure from Digital Beacon first-visit estimate. */
  co2Grams: "0.23",
} as const;
