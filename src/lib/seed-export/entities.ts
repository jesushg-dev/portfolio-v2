export const SEED_EXPORT_ENTITIES = [
  "skills",
  "projects",
  "services",
  "certifications",
  "timeline",
  "softSkills",
  "uses",
  "now",
  "processPages",
] as const;

export type SeedExportEntity = (typeof SEED_EXPORT_ENTITIES)[number];

export const SEED_EXPORT_FILENAMES: Record<SeedExportEntity, string> = {
  skills: "portfolio-skills.json",
  projects: "portfolio-projects.json",
  services: "portfolio-services.json",
  certifications: "portfolio-certifications.json",
  timeline: "portfolio-timeline.json",
  softSkills: "portfolio-soft-skills.json",
  uses: "portfolio-uses.json",
  now: "portfolio-now.json",
  processPages: "portfolio-process-pages.json",
};

export const SEED_EXPORT_ZIP_FILENAME = "portfolio-seed.json.zip";
