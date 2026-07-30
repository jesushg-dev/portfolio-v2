# iOS Device Component & Navigation System

This document outlines the architecture, component API, hooks, and usage examples for the **iOS Device & Navigation System** located in `src/components/shared/ios-device/`.

> [!NOTE]
> For a step-by-step guide on building interactive Mini Apps (Spotify pattern) within the iOS emulator, see [mini-apps-guide.md](file:///c:/Users/User/Desktop/portfolio-v2/docs/mini-apps-guide.md).

---

## Overview

The iOS Device System is a standalone, reusable phone simulator and navigation controller built for Portfolio v2. It decouples device hardware UI, gesture handling, navigation stack routing, and app launcher capabilities into a modular architecture.

### Key Features

- **Hardware Chassis Simulator (`IOSDeviceMockup`):** Render realistic iPhone bezels, side buttons, and safe area viewports.
- **Declarative Navigation Controller (`IOSNavigationStack`):** Manage route histories with native iOS transitions (`push` horizontal parallax and `sheet` vertical modal).
- **Lazy Mounting & On-Demand Lifecycle:** Unmounts inactive screens upon pop/dismiss to maintain minimal memory footprint and 60+ FPS performance.
- **Dynamic Island (`IOSDynamicIsland`):** Live Activity notification system with compact, expanded, and minimal states.
- **App Launcher (`IOSSpringBoard`):** iOS Home Screen grid component enabling interactive mini-app switching.
- **Co-located Hooks:** Encapsulated domain hooks residing inside `src/components/shared/ios-device/hooks/`.

---

## Directory Structure

```
src/components/shared/ios-device/
├── index.ts                      # Public module exports
├── ios-device-mockup.tsx         # Hardware frame, bezels, buttons & safe area wrapper
├── ios-dynamic-island.tsx        # Dynamic Island with reactive states
├── ios-window.tsx                # Viewport container with safe area insets
├── ios-navigation-stack.tsx     # Navigation controller & stack router
├── ios-navigation-bar.tsx       # Dynamic top bar with back navigation & title transitions
├── ios-home-bar.tsx              # Bottom home indicator with swipe gesture support
├── ios-springboard.tsx           # iOS Home Screen / App Grid launcher
├── ios-safe-area-context.tsx     # Context provider for safe area top/bottom insets
└── hooks/                        # Co-located domain hooks
    ├── use-ios-device.ts         # Viewport dimensions & safe area insets
    ├── use-ios-navigation.ts     # Navigation controller (push, pop, presentSheet, dismissSheet)
    ├── use-ios-sheet-gesture.ts  # Pan drag-to-dismiss gesture hook
    └── use-ios-dynamic-island.ts # Dynamic Island controller
```

---

## Component API & How to Use Guide

### 1. `<IOSDeviceMockup>`

Physical iPhone chassis component. Renders bezels, side hardware buttons, and wraps children inside an `IOSSafeAreaProvider`.

#### Component Signature

```tsx
interface IOSDeviceMockupProps {
  variant?: "iphone-16-pro" | "iphone-se";
  className?: string;
  screenRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}
```

#### How to Use

```tsx
import { IOSDeviceMockup } from "@/components/shared/ios-device";

export function SimplePhoneContainer() {
  return (
    <IOSDeviceMockup variant="iphone-16-pro" className="my-4">
      <div className="flex size-full items-center justify-center p-4">
        <p className="text-sm font-semibold">Content inside phone viewport</p>
      </div>
    </IOSDeviceMockup>
  );
}
```

---

### 2. `<IOSNavigationStack>` & `<IOSScreen>`

Declarative Stack Router managing navigation history, transitions, and screen mounting.

#### Component Signature

```tsx
interface IOSNavigationStackProps {
  initialRoute: string;
  initialTitle?: string;
  children: ReactNode;
  className?: string;
}

interface IOSScreenProps {
  id: string;
  title?: string;
  presentation?: "push" | "sheet"; // push = horizontal slide with parallax; sheet = vertical modal
  children: ReactNode;
}
```

#### How to Use

```tsx
import {
  IOSDeviceMockup,
  IOSNavigationStack,
  IOSScreen,
} from "@/components/shared/ios-device";

export function MultiScreenApp() {
  return (
    <IOSDeviceMockup>
      <IOSNavigationStack initialRoute="home">
        {/* Route 1: Main Home Screen */}
        <IOSScreen id="home" title="Home">
          <MyHomeScreen />
        </IOSScreen>

        {/* Route 2: Hierarchical Push Screen (Slide from right) */}
        <IOSScreen id="details" title="Details" presentation="push">
          <MyDetailsScreen />
        </IOSScreen>

        {/* Route 3: Modal Sheet Screen (Slide up from bottom) */}
        <IOSScreen id="modal" presentation="sheet">
          <MyModalSheetScreen />
        </IOSScreen>
      </IOSNavigationStack>
    </IOSDeviceMockup>
  );
}
```

---

### 3. `<IOSDynamicIsland>`

Dynamic Island component reflecting live activity notifications and compact/expanded states.

#### Component Signature

```tsx
type DynamicIslandState = "compact" | "expanded" | "minimal" | "hidden";

interface IOSDynamicIslandProps {
  overrideState?: DynamicIslandState;
  className?: string;
}
```

#### How to Use

```tsx
import { IOSDynamicIsland } from "@/components/shared/ios-device";

export function PhoneWithNotch() {
  return (
    <div className="relative h-150 w-72 bg-black">
      {/* Renders Dynamic Island inside top of phone */}
      <IOSDynamicIsland state="compact" />
    </div>
  );
}
```

---

### 4. `<IOSNavigationBar>`

Dynamic iOS top navigation header with auto-generated back buttons (`< ChevronLeft`), previous route titles, and cross-fade title transitions.

#### Component Signature

```tsx
interface IOSNavigationBarProps {
  title?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  className?: string;
}
```

#### How to Use

```tsx
import { IOSNavigationBar } from "@/components/shared/ios-device";

export function CustomHeaderView() {
  return (
    <div className="flex size-full flex-col">
      <IOSNavigationBar title="Screen Title" />
      <div className="flex-1 p-4">Screen Content</div>
    </div>
  );
}
```

---

### 5. `<IOSHomeBar>`

Bottom indicator home bar with swipe-up gesture and tap interaction.

#### Component Signature

```tsx
interface IOSHomeBarProps {
  className?: string;
  onSwipeUp?: () => void;
}
```

#### How to Use

```tsx
import { IOSHomeBar, useIOSNavigation } from "@/components/shared/ios-device";

export function ScreenWithHomeBar() {
  const { push } = useIOSNavigation();

  return (
    <div className="relative size-full">
      <p>App Content</p>
      {/* Return to SpringBoard when tapping or swiping home bar */}
      <IOSHomeBar onSwipeUp={() => push("springboard")} />
    </div>
  );
}
```

---

### 6. `<IOSSpringBoard>`

App grid launcher for switching between interactive mini-apps within the simulated device.

#### Component Signature

```tsx
interface IOSAppItem {
  id: string;
  name: string;
  icon: ReactNode;
  bgColor: string;
  badge?: string | number;
}

interface IOSSpringBoardProps {
  apps?: IOSAppItem[];
  className?: string;
  onOpenApp?: (appId: string) => void;
}
```

#### How to Use

```tsx
import {
  IOSSpringBoard,
  useIOSNavigation,
} from "@/components/shared/ios-device";

export function HomeScreen() {
  const { push } = useIOSNavigation();

  return (
    <IOSSpringBoard
      onOpenApp={(appId) => {
        push(appId);
      }}
    />
  );
}
```

---

## Domain Hooks & How to Use Guide

### 1. `useIOSNavigation()`

Exposes navigation controller actions for any child screen mounted within `<IOSNavigationStack>`.

#### How to Use

```tsx
import { useIOSNavigation } from "@/components/shared/ios-device";

export function HomeScreenButton() {
  const { push, pop, presentSheet, dismissSheet, canGoBack } =
    useIOSNavigation();

  return (
    <div className="space-y-2">
      {/* Navigate with Push animation */}
      <button
        onClick={() => push("artist-info", { id: "42" }, "Artist Profile")}
      >
        Push to Artist Profile
      </button>

      {/* Present Modal Sheet */}
      <button onClick={() => presentSheet("lyrics")}>
        Present Lyrics Sheet
      </button>

      {/* Pop or Dismiss */}
      {canGoBack && <button onClick={pop}>Go Back</button>}
    </div>
  );
}
```

---

### 2. `useIOSDevice()`

Returns viewport dimensions, safe area top/bottom insets, and device orientation.

#### How to Use

```tsx
import { useIOSDevice } from "@/components/shared/ios-device";

export function SafePaddedComponent() {
  const { topBarHeight, bottomHomeBarHeight, isDeviceMockup } = useIOSDevice();

  return (
    <div
      style={{
        paddingTop: `${topBarHeight}px`,
        paddingBottom: `${bottomHomeBarHeight}px`,
      }}
    >
      <p>
        Padded according to iOS safe areas ({topBarHeight}px top,{" "}
        {bottomHomeBarHeight}px bottom)
      </p>
    </div>
  );
}
```

---

### 3. `useIOSSheetGesture()`

Provides drag-to-dismiss gesture handling with spring physics for custom sheets.

#### How to Use

```tsx
import { motion } from "motion/react";
import { useIOSSheetGesture } from "@/components/shared/ios-device";

export function DraggableSheetModal({ onClose }: { onClose: () => void }) {
  const { dragY, dragProps } = useIOSSheetGesture({
    onClose,
    thresholdPx: 80,
  });

  return (
    <motion.div
      {...dragProps}
      style={{ y: dragY }}
      className="absolute inset-0 rounded-t-3xl bg-zinc-900 p-4 text-white"
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-600" />
      <p>Drag down to dismiss this sheet</p>
    </motion.div>
  );
}
```

---

### 4. `useIOSDynamicIsland()`

Emits live activity notifications and updates Dynamic Island content/states reactively.

#### How to Use

```tsx
import { useIOSDynamicIsland } from "@/components/shared/ios-device";

export function LiveActivityTrigger() {
  const { setIslandState, updateContent } = useIOSDynamicIsland();

  const handleStartMusic = () => {
    updateContent({
      leading: (
        <span className="size-2 animate-pulse rounded-full bg-green-500" />
      ),
      trailing: <span className="text-[10px] text-white">PLAYING</span>,
    });
    setIslandState("compact");
  };

  return (
    <button onClick={handleStartMusic}>Trigger Dynamic Island Activity</button>
  );
}
```

---

## Architectural & Design Constraints

### 1. Theming (`AGENTS.md` Compliance)

- Components use **semantic Tailwind design tokens** (`bg-card`, `text-foreground`, `border-border`, `bg-muted`).
- **No `dark:` class qualifiers:** Theme updates automatically propagate via the root `data-theme` attribute system.

### 2. Animation Library

- Exclusively uses **`motion/react`** (not `framer-motion`).
- Transitions leverage Apple spring physics (`stiffness: 300`, `damping: 32`) and GPU-accelerated transforms (`translate3d`, `scale`).

---

## Complete Integrated Usage Example

```tsx
import {
  IOSDeviceMockup,
  IOSNavigationStack,
  IOSScreen,
  IOSSpringBoard,
  IOSDynamicIsland
} from "@/components/shared/ios-device";
import SpotifyNowPlayingScreen from "@/components/shared/spotify-widget/spotify-now-playing-screen";
import SpotifyLyricsScreen from "@/components/shared/spotify-widget/spotify-lyrics-screen";

export default function PortfolioPhoneDemo() {
  return (
    <IOSDeviceMockup>
      <IOSDynamicIsland state="compact" />
      <IOSNavigationStack initialRoute="now-playing">
        {/* Main Player Screen */}
        <IOSScreen id="now-playing" title="Now Playing">
          <SpotifyNowPlayingScreen accentColor="#1db954" locale="en" flyComplete dragY={...} dragProps={...} onClose={...} />
        </IOSScreen>

        {/* Modal Sheet for Fullscreen Lyrics */}
        <IOSScreen id="lyrics" presentation="sheet">
          <SpotifyLyricsScreen accentColor="#1db954" />
        </IOSScreen>

        {/* SpringBoard App Launcher */}
        <IOSScreen id="springboard" title="Home">
          <IOSSpringBoard />
        </IOSScreen>
      </IOSNavigationStack>
    </IOSDeviceMockup>
  );
}
```
