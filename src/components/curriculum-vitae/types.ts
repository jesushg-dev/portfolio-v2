import type { Locale } from "@/i18n/config";
import type { RouterOutputs } from "@/trpc/react";

/**
 * Server-resolved CV data — the shape returned by `cv.getPublic` /
 * `cv.getMine` tRPC endpoints. Components in this folder receive the
 * relevant slice as props.
 */
export type CvData = NonNullable<RouterOutputs["cv"]["getPublic"]>;

export interface CvLocaleProps {
  locale: Locale;
  defaultLocale: Locale;
}
