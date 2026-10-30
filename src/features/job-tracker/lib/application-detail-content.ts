import type { CvMatchAnalysis } from "@/features/resume-engine/lib/cv-match-analysis";
import { extractJobTools } from "@/features/resume-engine/lib/extract-job-tools";
import type { ApplicationDetail } from "@/features/job-tracker/types";

export type DetailNotice = "resume-title" | "missing-details" | "self-email";

export function getApplicationDetailNotices(
  application: Pick<
    ApplicationDetail,
    "position" | "location" | "salary" | "company"
  > &
    Partial<Pick<ApplicationDetail, "cvFile">>,
  resumeTitle: string | null,
  viewerEmail: string,
): DetailNotice[] {
  const notices: DetailNotice[] = [];
  if (resumeTitle) {
    const roleWords = meaningfulWords(application.position);
    const titleWords = new Set(meaningfulWords(resumeTitle));
    if (
      roleWords.length > 0 &&
      !roleWords.some((word) => titleWords.has(word))
    ) {
      notices.push("resume-title");
    }
    const specialization =
      /\b(frontend|backend|fullstack|full[ -]stack|mobile)\b/gi;
    const fileRoles =
      application.cvFile?.name
        .match(specialization)
        ?.map((role) => role.toLowerCase().replace(/[ -]/g, "")) ?? [];
    const titleRoles =
      resumeTitle
        .match(specialization)
        ?.map((role) => role.toLowerCase().replace(/[ -]/g, "")) ?? [];
    if (
      !notices.includes("resume-title") &&
      fileRoles.length > 0 &&
      titleRoles.length > 0 &&
      !fileRoles.some((role) => titleRoles.includes(role))
    ) {
      notices.push("resume-title");
    }
  }
  if (!application.location.trim() || !application.salary.trim()) {
    notices.push("missing-details");
  }
  const companyEmail = application.company.email?.toLowerCase().trim();
  const normalizedViewerEmail = viewerEmail?.toLowerCase().trim();
  if (companyEmail && companyEmail === normalizedViewerEmail) {
    notices.push("self-email");
  }
  return notices;
}

function meaningfulWords(value: string): string[] {
  const generic = new Set([
    "senior",
    "junior",
    "developer",
    "engineer",
    "software",
    "desarrollador",
    "ingeniero",
    "de",
    "the",
    "full",
    "stack",
    "fullstack",
  ]);
  return (value.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) ?? []).filter(
    (word) => word.length > 2 && !generic.has(word),
  );
}

export function cleanImportedJobDescription(description: string): string {
  return description
    .split(/\r?\n/)
    .filter((line) => !/^\s*(?:jpe?g|png|webp|gif|\+\s*\d+)\s*$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface HighlightPart {
  text: string;
  status?: "present" | "partial" | "missing";
}

export function splitHighlightedDescription(
  description: string,
  analysis: CvMatchAnalysis | null,
): HighlightPart[] {
  const keywords = analysis?.keywords.length
    ? analysis.keywords.map((item) => ({
        term: item.term,
        status:
          item.status === "paraphrased" || item.status === "adjacent"
            ? ("partial" as const)
            : item.status,
      }))
    : extractJobTools(description).map((term) => ({
        term,
        status: "present" as const,
      }));
  const unique = [
    ...new Map(
      keywords.map((item) => [item.term.toLowerCase(), item]),
    ).values(),
  ]
    .filter((item) => item.term.trim())
    .sort((a, b) => b.term.length - a.term.length);
  if (unique.length === 0) return [{ text: description }];

  const pattern = new RegExp(
    `(?<![a-zA-Z0-9])(?:${unique.map((item) => escapeRegExp(item.term)).join("|")})(?![a-zA-Z0-9])`,
    "gi",
  );
  const parts: HighlightPart[] = [];
  let offset = 0;
  for (const match of description.matchAll(pattern)) {
    const index = match.index ?? offset;
    if (index > offset) parts.push({ text: description.slice(offset, index) });
    const item = unique.find(
      (keyword) => keyword.term.toLowerCase() === match[0].toLowerCase(),
    );
    parts.push({ text: match[0], status: item?.status });
    offset = index + match[0].length;
  }
  if (offset < description.length)
    parts.push({ text: description.slice(offset) });
  return parts;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
