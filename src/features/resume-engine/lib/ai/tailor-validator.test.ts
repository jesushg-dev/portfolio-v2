import { validateTailorEdits } from "./tailor-validator";
import type { CvSection } from "@/lib/types";

describe("Post-LLM Validator (T4 / T10 Adversarial cases)", () => {
  const sampleSections: CvSection[] = [
    {
      id: "section-0",
      heading: "Header",
      paragraphs: [
        {
          id: "section-0-para-0",
          style: "Ttulo",
          xmlIndex: 0,
          runs: [
            {
              id: "section-0-para-0-run-0",
              text: "Fullstack Developer with 6+ years of experience",
            },
          ],
        },
      ],
    },
    {
      id: "section-1",
      heading: "Technical Skills",
      paragraphs: [
        {
          id: "section-1-para-0",
          style: "Normal",
          xmlIndex: 1,
          runs: [
            {
              id: "section-1-para-0-run-0",
              text: "React, TypeScript, Next.js",
            },
          ],
        },
      ],
    },
    {
      id: "section-2",
      heading: "Professional Experience",
      paragraphs: [
        {
          id: "section-2-para-0",
          style: "ListParagraph",
          xmlIndex: 2,
          runs: [
            {
              id: "section-2-para-0-run-0",
              text: "Improved checkout performance by ~40% and saved 120+ hours per month using React and Node.js.",
            },
          ],
        },
        {
          id: "section-2-para-1",
          style: "ListParagraph",
          xmlIndex: 3,
          runs: [
            {
              id: "section-2-para-1-run-0",
              text: "Reduced regression testing cycle from 7 to 4 days.",
            },
          ],
        },
      ],
    },
    {
      id: "section-3",
      heading: "Languages",
      paragraphs: [
        {
          id: "section-3-para-0",
          style: "Normal",
          xmlIndex: 4,
          runs: [
            {
              id: "section-3-para-0-run-0",
              text: "English (B2), Spanish (C2)",
            },
          ],
        },
      ],
    },
  ];

  it("handles Case 2: Altering metrics from '~40%' to '50%' (E4)", () => {
    const edits = [
      {
        id: "section-2-para-0-run-0",
        text: "Improved checkout performance by 50% using React and Node.js.",
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Senior engineer",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.reverted).toHaveLength(1);
    expect(result.reverted[0].code).toBe("E4_METRIC_HALLUCINATION");
  });

  it("handles Case 3: Removing or modifying skills in a group (E3)", () => {
    const edits = [
      {
        id: "section-1-para-0-run-0",
        text: "React, TypeScript", // Removed Next.js!
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Frontend dev",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.reverted).toHaveLength(1);
    expect(result.reverted[0].code).toBe("E3_SKILLS_MISMATCH");
  });

  it("allows reordering skills within a group (E3 valid)", () => {
    const edits = [
      {
        id: "section-1-para-0-run-0",
        text: "Next.js, TypeScript, React", // Same skills, reordered!
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Frontend dev",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(1);
    expect(result.reverted).toHaveLength(0);
  });

  it("handles Case 4: Editing a locked run (E1)", () => {
    const lockedSections = JSON.parse(
      JSON.stringify(sampleSections),
    ) as CvSection[];
    lockedSections[0].paragraphs[0].runs[0].locked = true;

    const edits = [
      {
        id: "section-0-para-0-run-0",
        text: "New Headline",
      },
    ];

    const result = validateTailorEdits({
      originalSections: lockedSections,
      jobDescription: "Test",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.reverted).toHaveLength(1);
    expect(result.reverted[0].code).toBe("E1_UNKNOWN_OR_LOCKED");
  });

  it("handles Case 5: Exceeding character budget (E2 -> needsShrink)", () => {
    const originalText = sampleSections[2].paragraphs[0].runs[0].text;
    const veryLongText =
      originalText + " ".repeat(50) + "extra text that makes it way too long";

    const edits = [
      {
        id: "section-2-para-0-run-0",
        text: veryLongText,
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Test",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.needsShrink).toHaveLength(1);
    expect(result.needsShrink[0].id).toBe("section-2-para-0-run-0");
  });

  it("handles Case 7: Nonexistent run ID (E1)", () => {
    const edits = [
      {
        id: "nonexistent-run-id-999",
        text: "Some rogue text",
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Test",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.reverted).toHaveLength(1);
    expect(result.reverted[0].code).toBe("E1_UNKNOWN_OR_LOCKED");
  });

  it("handles Case 8: Emptying all bullets of a job (E8)", () => {
    const edits = [
      {
        id: "section-2-para-0-run-0",
        text: "",
      },
      {
        id: "section-2-para-1-run-0",
        text: "",
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Test",
      edits,
    });

    // One bullet must be preserved (not emptied)
    expect(result.acceptedEdits).toHaveLength(1);
    expect(result.reverted.some((r) => r.code === "E8_EMPTY_JOB_BULLETS")).toBe(
      true,
    );
  });

  it("handles Case 9: Altering years of experience from '6+ years' to '8+ years' (E5)", () => {
    const edits = [
      {
        id: "section-0-para-0-run-0",
        text: "Fullstack Developer with 8+ years of experience",
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Test",
      yearsOfExperience: 6,
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.reverted).toHaveLength(1);
    expect(result.reverted[0].code).toBe("E5_YEARS_EXP_MISMATCH");
  });

  it("handles CEFR credential alteration (E7)", () => {
    const edits = [
      {
        id: "section-3-para-0-run-0",
        text: "English (C1), Spanish (C2)", // Altered B2 to C1!
      },
    ];

    const result = validateTailorEdits({
      originalSections: sampleSections,
      jobDescription: "Test",
      edits,
    });

    expect(result.acceptedEdits).toHaveLength(0);
    expect(result.reverted).toHaveLength(1);
    expect(result.reverted[0].code).toBe("E7_CREDENTIAL_CORRUPTED");
  });
});
