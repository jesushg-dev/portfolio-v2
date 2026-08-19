export const CV_DESIGNS = ["default", "ats"] as const;
export type CvDesignId = (typeof CV_DESIGNS)[number];

export const DEFAULT_CV_DESIGN: CvDesignId = "default";

export function isValidCvDesign(value: unknown): value is CvDesignId {
  return (
    typeof value === "string" &&
    (CV_DESIGNS as readonly string[]).includes(value)
  );
}

export interface CvDesignEntry {
  id: CvDesignId;
  labelKey: string;
}

export const cvDesignRegistry: CvDesignEntry[] = [
  { id: "default", labelKey: "curriculum.designs.default" },
  { id: "ats", labelKey: "curriculum.designs.ats" },
];
