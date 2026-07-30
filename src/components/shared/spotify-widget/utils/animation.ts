export const SPOTIFY_LAYOUT_SPRING = {
  type: "spring",
  stiffness: 640,
  damping: 44,
  mass: 0.5,
} as const;

export const SPOTIFY_BACKDROP_TRANSITION = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1],
} as const;

export const SPOTIFY_PANEL_SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 36,
  mass: 0.65,
} as const;

export const SPOTIFY_REVEAL_TRANSITION = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
} as const;
