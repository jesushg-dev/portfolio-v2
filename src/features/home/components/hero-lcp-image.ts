import { optimizeCloudinaryImageUrl } from "@/utils/tools/image";

/** Display size is 256–320px; 320px covers md breakpoint without excess bytes. */
export const HERO_LCP_WIDTH = 320;

export function getHeroLcpImageUrl(photoUrl: string): string {
  return optimizeCloudinaryImageUrl(photoUrl, HERO_LCP_WIDTH, "auto:good");
}
