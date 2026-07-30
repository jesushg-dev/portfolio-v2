import { ETime } from "@/utils/constants/times";

/** When remaining playback time drops below this, poll faster and prefetch next lyrics. */
export const SPOTIFY_NEAR_END_MS = 45 * ETime.SECOND;
