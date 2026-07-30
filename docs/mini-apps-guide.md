# Mini Apps Creation Guide with `ios-device` (Spotify Pattern)

This guide provides a detailed walkthrough of how to design, structure, and integrate **interactive Mini Apps** using the iOS device emulation system located in `src/components/shared/ios-device/`.

---

## 1. Architectural Overview

A Mini App within the `ios-device` system is a self-contained client application running inside the physical iPhone frame viewport (`IOSDeviceMockup`).

### Layer Structure

1. **Physical Frame Layer (`IOSDeviceMockup`)**: Physical phone chassis (bezels, side buttons, Dynamic Island, safe area insets).
2. **Navigation Stack Layer (`IOSNavigationStack`)**: Mini App route manager (`push` horizontal slide with parallax or `sheet` vertical modal with drag-to-dismiss).
3. **App Launcher Layer (`IOSSpringBoard`)**: Home Screen icon grid for switching between Mini Apps.
4. **Mini App View Layer (`IOSScreen`)**: Container screen hosting Mini App views (e.g., Spotify Player, Fullscreen Lyrics, Weather, etc.).

---

## 2. Mini App Design Pattern (Spotify Case Study)

The Spotify Mini App in this repository serves as the **reference design pattern**. It has the following architecture:

```
src/components/shared/spotify-widget/
├── components/                     # Mini App UI views
│   ├── animated-gradient.tsx       # Dynamic background canvas based on album cover
│   ├── lyrics-card.tsx             # Synced lyrics preview card
│   ├── lyrics-fullscreen.tsx       # Fullscreen lyrics modal sheet view
│   ├── now-playing-hint.tsx        # Hint / Tooltip overlay
│   ├── player.tsx                  # Audio preview player component
│   ├── playing-indicator.tsx       # Animated equalizer indicator
│   ├── progress-bar.tsx            # Interactive track progress bar
│   ├── progress-timer.tsx          # Elapsed / Total duration timer (01:30 / 03:45)
│   ├── recently-played-notice.tsx  # Recently played track notice
│   ├── spotify-fullscreen-progress.tsx
│   ├── spotify-lyrics-screen.tsx   # Lyrics screen wrapper for iOS router
│   └── spotify-now-playing-screen.tsx # Main "Now Playing" screen for iOS router
├── hooks/                          # Custom React Hooks
│   ├── use-album-color.ts          # Dominant album color extraction
│   ├── use-drag-to-close.ts        # Drag-to-dismiss gesture handling
│   ├── use-playback-clock.ts       # Client-side 100ms synced clock
│   ├── use-prefetch-next-lyrics.ts # Background prefetching of upcoming lyrics
│   ├── use-spotify-playback.ts     # Real-time data fetching hook (tRPC polling)
│   └── use-track-lyrics.ts         # Synced lyrics fetching hook (LRCLIB API)
├── utils/                          # Mappers & pure utility functions
│   ├── animation.ts                # Apple spring physics transitions (motion/react)
│   ├── expand-rects.ts             # FLIP animation coordinate calculations
│   ├── format-played-at.ts         # Relative time i18n formatter
│   ├── parse-lrc.ts                # Subtitle LRC parser ([mm:ss.xx])
│   ├── playback-mappers.ts         # Spotify API response DTO mappers
│   ├── resolve-spotify-playback.ts # Resolution between active vs recently played
│   └── resolve-track-progress.ts   # Progress percentage calculation
├── types/                          # TypeScript definitions
│   ├── track-lyrics-types.ts
│   └── types.ts
├── context/                        # React Context
│   └── spotify-playback-context.tsx# Global playback state provider for the Mini App
├── expandable-spotify-player.tsx   # Main expandable player container
├── index.tsx                       # Public widget export
├── spotify-widget-lazy.tsx        # Lazy loading wrapper (next/dynamic)
└── spotify-widget-skeleton.tsx    # Loading state UI
```

---

## 3. Step-by-Step Guide to Creating a New Mini App

### Step 1: Define App Route IDs and Icons in `IOSSpringBoard`

Define the application key and icon representation in the iOS Home Screen grid:

```tsx
import { Music, CloudSun } from "lucide-react";

export const MINI_APPS = [
  {
    id: "spotify",
    name: "Spotify",
    icon: <Music className="size-6 text-white" />,
    bgColor: "bg-[#1DB954]",
  },
  {
    id: "weather",
    name: "Weather",
    icon: <CloudSun className="size-6 text-white" />,
    bgColor: "bg-sky-500",
  },
];
```

---

### Step 2: Encapsulate State with a Context Provider

Each Mini App should wrap its sub-components in a local Context Provider to prevent prop drilling and grant any screen access to device/player state:

```tsx
// src/components/shared/my-mini-app/context/app-context.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AppContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AppContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
```

---

### Step 3: Configure Routes in `IOSNavigationStack`

Insert Mini App screens inside `<IOSNavigationStack>` using `<IOSScreen>`:

- Use `presentation="push"` for lateral hierarchical navigation (swipe right to go back).
- Use `presentation="sheet"` for modal popups (drag down to dismiss).

```tsx
import {
  IOSDeviceMockup,
  IOSNavigationStack,
  IOSScreen,
  IOSSpringBoard,
  useIOSNavigation,
} from "@/components/shared/ios-device";
import { AppProvider } from "./context/app-context";
import MainAppScreen from "./components/main-app-screen";
import DetailScreen from "./components/detail-screen";
import SettingsSheet from "./components/settings-sheet";

export default function MiniAppContainer() {
  return (
    <IOSDeviceMockup variant="iphone-16-pro">
      <AppProvider>
        <IOSNavigationStack initialRoute="springboard">
          {/* 1. SpringBoard (iOS Home Screen) */}
          <IOSScreen id="springboard" title="Home">
            <IOSSpringBoard
              onOpenApp={(appId) => {
                // Navigate to selected mini app
              }}
            />
          </IOSScreen>

          {/* 2. Main Mini App Screen */}
          <IOSScreen id="my-app-main" title="My Mini App">
            <MainAppScreen />
          </IOSScreen>

          {/* 3. Secondary Screen (Push) */}
          <IOSScreen id="my-app-detail" title="Details" presentation="push">
            <DetailScreen />
          </IOSScreen>

          {/* 4. Settings Modal (Sheet) */}
          <IOSScreen id="my-app-settings" presentation="sheet">
            <SettingsSheet />
          </IOSScreen>
        </IOSNavigationStack>
      </AppProvider>
    </IOSDeviceMockup>
  );
}
```

---

### Step 4: Navigation and Gestures with `useIOSNavigation`

Inside any child screen of `<IOSScreen>`, consume the `useIOSNavigation()` hook to manage flow:

```tsx
"use client";

import { useIOSNavigation } from "@/components/shared/ios-device";

export default function MainAppScreen() {
  const { push, presentSheet, pop } = useIOSNavigation();

  return (
    <div className="flex size-full flex-col items-center justify-center p-4 text-white">
      <h1 className="text-xl font-bold">Main Screen</h1>

      <button
        onClick={() => push("my-app-detail", { itemId: "123" }, "Item Details")}
        className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold"
      >
        View Details (Push Slide)
      </button>

      <button
        onClick={() => presentSheet("my-app-settings")}
        className="mt-2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold"
      >
        Open Settings (Modal Sheet)
      </button>
    </div>
  );
}
```

---

### Step 5: Integration with Dynamic Island (`IOSDynamicIsland`)

To project Live Activities (audio playback, timers, or network status) onto the iPhone dynamic notch:

```tsx
"use client";

import { useEffect } from "react";
import { useIOSDynamicIsland } from "@/components/shared/ios-device";

export function MiniAppLiveActivity({
  isPlaying,
  trackTitle,
}: {
  isPlaying: boolean;
  trackTitle: string;
}) {
  const { setIslandState, updateContent } = useIOSDynamicIsland();

  useEffect(() => {
    if (isPlaying) {
      updateContent({
        leading: (
          <span className="size-2 animate-pulse rounded-full bg-green-500" />
        ),
        trailing: (
          <span className="max-w-20 truncate text-[10px] font-medium text-white">
            {trackTitle}
          </span>
        ),
      });
      setIslandState("compact");
    } else {
      setIslandState("hidden");
    }
  }, [isPlaying, trackTitle, setIslandState, updateContent]);

  return null;
}
```

---

## 4. Best Practices & System Rules

1. **Exclusive Use of `motion/react`**: Do not import `framer-motion`. Always use `import { motion, AnimatePresence } from "motion/react"`.
2. **Native Gesture Dismissal**: For `sheet` views, ensure drag gesture support using `useIOSSheetGesture()` or `IOSNavigationStack` to allow users to drag down to dismiss the mini app.
3. **Respect Safe Area Insets**: Use `useIOSDevice()` to obtain `topBarHeight` and `bottomHomeBarHeight` to prevent content from clipping underneath the notch or bottom home indicator.
4. **Single `useTranslations` Call per File**: When integrating i18n (`next-intl`), never invoke `useTranslations` more than once per source file.
