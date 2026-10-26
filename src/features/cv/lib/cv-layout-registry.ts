export const CV_LAYOUT_STYLES = ["modern", "classic"] as const;
export type CvLayoutStyle = (typeof CV_LAYOUT_STYLES)[number];

export const DEFAULT_CV_LAYOUT_STYLE: CvLayoutStyle = "modern";

export function isValidCvLayoutStyle(value: unknown): value is CvLayoutStyle {
  return (
    typeof value === "string" &&
    (CV_LAYOUT_STYLES as readonly string[]).includes(value)
  );
}

export interface CvLayoutEntry {
  id: CvLayoutStyle;
  labelKey: "layoutModern" | "layoutClassic";
}

export const cvLayoutRegistry: CvLayoutEntry[] = [
  { id: "modern", labelKey: "layoutModern" },
  { id: "classic", labelKey: "layoutClassic" },
];
