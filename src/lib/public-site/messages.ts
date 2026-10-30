import type { Messages } from "next-intl";

/** Only shared navigation and widgets belong in the public root provider. */
export function pickPublicMessages(messages: Messages) {
  return { global: messages.global };
}

const routeMainKeys = {
  home: [
    "about",
    "socialProof",
    "skills",
    "experience",
    "portfolio",
    "contact",
  ],
  now: ["now"],
  timeline: ["timeline"],
  projects: ["portfolio"],
  skills: ["skills"],
  schedule: ["contact"],
  colophon: ["colophon"],
  certificates: [],
  curriculum: [],
  themeCustomizer: [],
} as const satisfies Record<string, readonly (keyof Messages["main"])[]>;

export type PublicMessageScope = keyof typeof routeMainKeys;

/** Nested providers replace messages, so retain the shared namespace explicitly. */
export function pickPublicRouteMessages(
  messages: Messages,
  scope: PublicMessageScope,
) {
  const main = Object.fromEntries(
    routeMainKeys[scope].map((key) => [key, messages.main[key]]),
  );

  return {
    ...pickPublicMessages(messages),
    ...(routeMainKeys[scope].length ? { main } : {}),
    ...(scope === "certificates" || scope === "skills"
      ? { certification: messages.certification }
      : {}),
    ...(scope === "curriculum" ? { curriculum: messages.curriculum } : {}),
    ...(scope === "themeCustomizer"
      ? { themeCustomizer: messages.themeCustomizer }
      : {}),
  };
}
