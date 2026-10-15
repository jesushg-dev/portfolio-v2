import type { CvSection, CvParagraph, CvRun } from "@/lib/types";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import { isDocxTitleStyle } from "@/lib/docx/parser";

export interface TailorValidationReverted {
  id: string;
  originalText: string;
  rejectedText: string;
  reason: string;
  code:
    | "E1_UNKNOWN_OR_LOCKED"
    | "E2_OVER_BUDGET"
    | "E3_SKILLS_MISMATCH"
    | "E4_METRIC_HALLUCINATION"
    | "E5_YEARS_EXP_MISMATCH"
    | "E7_CREDENTIAL_CORRUPTED"
    | "E8_EMPTY_JOB_BULLETS";
}

export interface TailorValidationShrinkCandidate {
  id: string;
  text: string;
  budget: number;
  currentLength: number;
  role: "summary" | "bullet" | "headline" | "other";
}

export interface TailorValidationResult {
  acceptedEdits: { id: string; text: string }[];
  reverted: TailorValidationReverted[];
  warnings: string[];
  needsShrink: TailorValidationShrinkCandidate[];
}

export interface ValidateTailorEditsInput {
  originalSections: CvSection[];
  sourceDraft?: CvImportDraft | null;
  jobDescription: string;
  edits: { id: string; text: string }[];
  yearsOfExperience?: number;
}

// Tokenizer for metrics (E4)
// Matches "~40%", "+30%", "-60%", "120+", "1k+", "7 a 4", "30 a 12 min", etc.
export const METRIC_REGEX =
  /(?:[~+−-]?\d+(?:\.\d+)?%|\b\d+\+\b|\b\d+k\+\b|\b\d+\s*(?:a|to|tot)\s*\d+(?:\s*(?:min|días|days|dagen|semanas|weeks|meses|months))?)/gi;

export function extractMetrics(text: string): string[] {
  const regex = new RegExp(METRIC_REGEX.source, "gi");
  const matches = text.match(regex) ?? [];
  return matches.map((m) => m.trim().toLowerCase());
}

// Years of experience regex (E5)
export const YEARS_EXP_REGEX = /\b(\d+)\+?\s*(?:años|years|jaar|yrs)\b/i;

export function cleanEditRunText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  // 1. Strip markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // 2. Strip markdown strikethrough ~~text~~ -> text
  text = text.replace(/~~([^~]+)~~/g, "$1");
  // 3. Strip markdown formatting chars (*, _, `)
  text = text.replace(/[*_`]/g, "");
  // 4. Strip emojis and pictorial symbols
  text = text.replace(
    /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,
    "",
  );
  // 5. Strip control characters except newline
  text = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // 6. Normalize whitespace
  text = text.replace(/[ \t]+/g, " ");
  return text.trim();
}

export function validateTailorEdits(
  input: ValidateTailorEditsInput,
): TailorValidationResult {
  const { originalSections, sourceDraft, edits, yearsOfExperience } = input;

  const acceptedEdits: { id: string; text: string }[] = [];
  const reverted: TailorValidationReverted[] = [];
  const warnings: string[] = [];
  const needsShrink: TailorValidationShrinkCandidate[] = [];

  // Build index of original runs and paragraphs
  const runToParaMap = new Map<
    string,
    { run: CvRun; para: CvParagraph; section: CvSection }
  >();
  const paraToSectionMap = new Map<string, CvSection>();

  for (const section of originalSections) {
    for (const para of section.paragraphs) {
      paraToSectionMap.set(para.id, section);
      for (const run of para.runs) {
        runToParaMap.set(run.id, { run, para, section });
      }
    }
  }

  // Group edits by paragraph
  const editsByParaId = new Map<string, { id: string; text: string }[]>();
  const editMap = new Map<string, string>();

  for (const rawEdit of edits) {
    const edit = {
      id: rawEdit.id,
      text: cleanEditRunText(rawEdit.text),
    };
    editMap.set(edit.id, edit.text);
    const info = runToParaMap.get(edit.id);
    if (!info) {
      // E1: Unknown ID
      reverted.push({
        id: edit.id,
        originalText: "",
        rejectedText: edit.text,
        reason: `Unknown run ID "${edit.id}"`,
        code: "E1_UNKNOWN_OR_LOCKED",
      });
      warnings.push(`E1: Discarded edit for unknown run id: ${edit.id}`);
      continue;
    }

    if (info.run.locked || info.para.locked) {
      // E1: Locked run/paragraph
      reverted.push({
        id: edit.id,
        originalText: info.run.text,
        rejectedText: edit.text,
        reason: `Run "${edit.id}" is locked and cannot be edited`,
        code: "E1_UNKNOWN_OR_LOCKED",
      });
      warnings.push(`E1: Discarded edit for locked run: ${edit.id}`);
      continue;
    }

    const list = editsByParaId.get(info.para.id) ?? [];
    list.push(edit);
    editsByParaId.set(info.para.id, list);
  }

  // Inspect each paragraph in the document
  for (const section of originalSections) {
    const isSkillsSection =
      /skills|habilidades|vaardigheden/i.test(section.heading) &&
      !/soft/i.test(section.heading);

    for (const para of section.paragraphs) {
      if (para.locked) continue;

      const paraEdits = editsByParaId.get(para.id);
      if (!paraEdits || paraEdits.length === 0) continue;

      // Determine paragraph role
      const isHeadline = isDocxTitleStyle(para.style);
      const isSummary = /about me|sobre mí|resumen|summary/i.test(
        section.heading,
      );
      const isBullet = /experience|experiencia|ervaring/i.test(section.heading);
      const role: "summary" | "bullet" | "headline" | "other" = isHeadline
        ? "headline"
        : isSummary
          ? "summary"
          : isBullet
            ? "bullet"
            : "other";

      // Calculate total original length and budget
      const paraLength = para.runs.reduce((sum, r) => sum + r.text.length, 0);
      const paraBudget = isHeadline ? Math.ceil(1.2 * paraLength) : paraLength;

      // Construct prospective full paragraph text
      const prospectiveRuns = para.runs.map((r) => {
        const edited = editMap.get(r.id);
        return edited ?? r.text;
      });
      const prospectiveText = prospectiveRuns.join("");

      // E2 Check: Over budget check
      if (prospectiveText.length > paraBudget) {
        for (const edit of paraEdits) {
          needsShrink.push({
            id: edit.id,
            text: edit.text,
            budget: paraBudget,
            currentLength: prospectiveText.length,
            role,
          });
        }
        warnings.push(
          `E2: Run ${paraEdits.map((e) => e.id).join(",")} exceeds budget (${prospectiveText.length} > ${paraBudget}); flagged for shrink.`,
        );
        // Do not accept over-budget runs yet
        continue;
      }

      // E3 Check: Skills multiset check
      if (isSkillsSection) {
        const origSkills = para.runs
          .map((r) => r.text)
          .join("")
          .split(/[,·|•\n]/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .sort();

        const prospectiveSkills = prospectiveText
          .split(/[,·|•\n]/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .sort();

        if (
          origSkills.length !== prospectiveSkills.length ||
          !origSkills.every((val, idx) => val === prospectiveSkills[idx])
        ) {
          for (const edit of paraEdits) {
            const originalRun = runToParaMap.get(edit.id)?.run;
            reverted.push({
              id: edit.id,
              originalText: originalRun?.text ?? "",
              rejectedText: edit.text,
              reason: `Skills multiset mismatch in group "${section.heading}"`,
              code: "E3_SKILLS_MISMATCH",
            });
          }
          warnings.push(
            `E3: Reverted skill edits in "${section.heading}": items were added or removed rather than reordered.`,
          );
          continue;
        }
      }

      // E4 Check: Metrics hallucination check per experience bullet
      if (isBullet) {
        // Collect source metrics for this specific job/bullet
        const originalBulletMetrics = extractMetrics(
          para.runs.map((r) => r.text).join(""),
        );
        // Also look at draft responsibilities for this job if available
        const draftJobMetrics: string[] = [];
        if (sourceDraft?.experiences) {
          const matchingExp = sourceDraft.experiences.find((exp) => {
            const fullParaText = para.runs.map((r) => r.text).join("");
            return exp.responsibilities.some((resp) =>
              fullParaText.includes(resp.slice(0, 20)),
            );
          });
          if (matchingExp) {
            for (const r of [
              ...matchingExp.responsibilities,
              ...matchingExp.atsResponsibilities,
            ]) {
              draftJobMetrics.push(...extractMetrics(r));
            }
          }
        }

        const allowedJobMetrics = new Set([
          ...originalBulletMetrics,
          ...draftJobMetrics,
        ]);

        const candidateMetrics = extractMetrics(prospectiveText);
        const hasInventedMetric = candidateMetrics.some(
          (m) => !allowedJobMetrics.has(m),
        );

        if (hasInventedMetric) {
          for (const edit of paraEdits) {
            const originalRun = runToParaMap.get(edit.id)?.run;
            reverted.push({
              id: edit.id,
              originalText: originalRun?.text ?? "",
              rejectedText: edit.text,
              reason: `Invented metric found: candidate metrics [${candidateMetrics.join(", ")}] not in source [${Array.from(allowedJobMetrics).join(", ")}]`,
              code: "E4_METRIC_HALLUCINATION",
            });
          }
          warnings.push(
            `E4: Reverted bullet "${para.id}": metrics were invented or altered.`,
          );
          continue;
        }
      }

      // E5 Check: Years of experience mismatch
      const prospectiveExpMatch = YEARS_EXP_REGEX.exec(prospectiveText);
      if (prospectiveExpMatch) {
        const candidateYears = parseInt(prospectiveExpMatch[1], 10);
        let expectedYears = yearsOfExperience;
        if (!expectedYears) {
          const origExpMatch = YEARS_EXP_REGEX.exec(
            para.runs.map((r) => r.text).join(""),
          );
          if (origExpMatch) {
            expectedYears = parseInt(origExpMatch[1], 10);
          }
        }

        if (expectedYears !== undefined && candidateYears !== expectedYears) {
          for (const edit of paraEdits) {
            const originalRun = runToParaMap.get(edit.id)?.run;
            reverted.push({
              id: edit.id,
              originalText: originalRun?.text ?? "",
              rejectedText: edit.text,
              reason: `Years of experience mismatch: stated ${candidateYears} instead of ${expectedYears}`,
              code: "E5_YEARS_EXP_MISMATCH",
            });
          }
          warnings.push(
            `E5: Reverted paragraph "${para.id}": years of experience changed from ${expectedYears} to ${candidateYears}.`,
          );
          continue;
        }
      }

      // E7 Check: Credentials (CEFR codes, 4-digit years)
      const origText = para.runs.map((r) => r.text).join("");
      const origCefr: string[] | null = origText.match(
        /\b(A1|A2|B1|B2|C1|C2)\b/g,
      );
      if (origCefr) {
        const candCefr: string[] =
          prospectiveText.match(/\b(A1|A2|B1|B2|C1|C2)\b/g) ?? [];
        if (!origCefr.every((c) => candCefr.includes(c))) {
          for (const edit of paraEdits) {
            const originalRun = runToParaMap.get(edit.id)?.run;
            reverted.push({
              id: edit.id,
              originalText: originalRun?.text ?? "",
              rejectedText: edit.text,
              reason: `CEFR language credential altered or removed`,
              code: "E7_CREDENTIAL_CORRUPTED",
            });
          }
          warnings.push(`E7: Reverted credentials in "${para.id}".`);
          continue;
        }
      }

      // If all checks passed: accept these edits!
      for (const edit of paraEdits) {
        acceptedEdits.push(edit);
      }
    }
  }

  // E8 Check: Each job in experience must retain at least 1 non-empty bullet
  const experienceSection = originalSections.find((s) =>
    /experience|experiencia|ervaring/i.test(s.heading),
  );

  if (experienceSection) {
    // If all bullets in experience were emptied, revert the first one
    const acceptedMap = new Map(acceptedEdits.map((e) => [e.id, e.text]));
    const nonEmptiedBullets = experienceSection.paragraphs.filter((p) => {
      const pText = p.runs
        .map((r) => (acceptedMap.has(r.id) ? acceptedMap.get(r.id)! : r.text))
        .join("");
      return pText.trim().length > 0;
    });

    if (
      nonEmptiedBullets.length === 0 &&
      experienceSection.paragraphs.length > 0
    ) {
      const firstPara = experienceSection.paragraphs[0];
      for (const r of firstPara.runs) {
        // Remove from accepted if it was an empty edit
        const idx = acceptedEdits.findIndex((e) => e.id === r.id);
        if (idx >= 0) {
          const removed = acceptedEdits.splice(idx, 1)[0];
          reverted.push({
            id: r.id,
            originalText: r.text,
            rejectedText: removed.text,
            reason: "Job experience must keep at least 1 non-empty bullet",
            code: "E8_EMPTY_JOB_BULLETS",
          });
        }
      }
      warnings.push(
        "E8: Reverted empty bullets: experience must have at least 1 non-empty bullet.",
      );
    }
  }

  return {
    acceptedEdits,
    reverted,
    warnings,
    needsShrink,
  };
}
