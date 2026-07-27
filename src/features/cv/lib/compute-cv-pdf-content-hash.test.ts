import { computeCvPdfContentHash } from "@/features/cv/lib/compute-cv-pdf-content-hash";
import type { CvPreviewSnapshot } from "@/features/cv/lib/load-cv-preview-snapshot";

const baseSnapshot: CvPreviewSnapshot = {
  header: {
    fullName: "Jane Doe",
    degree: "BSc Computer Science",
    photoUrl: null,
    backgroundImageUrl: null,
    heroSummary: "Backend engineer",
    clientImageAlt: null,
  },
  aboutMeText: "About me",
  contacts: [],
  educations: [],
  languages: [],
  technicalSkills: [],
  experiences: [],
  softSkills: [],
  additionalInformation: [],
};

describe("computeCvPdfContentHash", () => {
  it("returns a stable hash for the same snapshot", () => {
    const first = computeCvPdfContentHash(baseSnapshot, false);
    const second = computeCvPdfContentHash(baseSnapshot, false);

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it("changes when CV content changes", () => {
    const original = computeCvPdfContentHash(baseSnapshot, false);
    const updated = computeCvPdfContentHash(
      {
        ...baseSnapshot,
        header: {
          ...baseSnapshot.header!,
          fullName: "John Doe",
        },
      },
      false,
    );

    expect(updated).not.toBe(original);
  });

  it("changes when pagination mode changes", () => {
    const continuous = computeCvPdfContentHash(baseSnapshot, false);
    const paginated = computeCvPdfContentHash(baseSnapshot, true);

    expect(paginated).not.toBe(continuous);
  });
});
