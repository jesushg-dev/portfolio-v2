import { z } from "zod";

export const ApplicationCoverLetterDraftSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  notes: z.string().nullable().optional(),
});

export type ApplicationCoverLetterDraft = z.infer<
  typeof ApplicationCoverLetterDraftSchema
>;

export interface DraftApplicationCoverLetterInput {
  position: string;
  companyName: string;
  companyDescription?: string | null;
  location?: string | null;
  salary?: string | null;
  notes?: string | null;
  jobDescription: string;
  candidate: {
    fullName: string;
    degree?: string | null;
    summary?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin?: string | null;
    softSkills?: string[];
    highlights?: string[];
  };
}

export function buildApplicationCoverLetterSystemPrompt(): string {
  return `
You help a job seeker write a formal cover letter (not a short email) to accompany a CV for one specific job posting.

LANGUAGE: Detect the job description locale ("en", "es", or "nl"). Write subject and body in that language only. Never mix languages.

RULES:
- Subject: concise line suitable as a document title or email subject (role + company + candidate name when natural).
- Body: a proper cover letter of 3–5 short paragraphs (roughly 180–320 words). Structure:
  1) Greeting + why this role/company
  2) 1–2 truthful achievements or strengths mapped to the JD (prefer quantified evidence from the summary/highlights)
  3) Soft skills or working style only when truthful and relevant
  4) Closing with interest + availability to talk; sign with the candidate's name only
- Mirror a few JD keywords only when they are true for the candidate.
- Use companyDescription, location, salary, and notes for tone/emphasis when helpful — never invent facts from them.
- Never invent companies, years of experience digits, metrics, tools, or contact details not provided.
- Do NOT include a full contact signature block (email/phone/linkedin); the name at the end is enough.
- Return ONLY JSON matching:
{
  "subject": "...",
  "body": "plain text with newlines between paragraphs",
  "notes": "optional note" | null
}
`.trim();
}

export function buildApplicationCoverLetterUserPrompt(
  input: DraftApplicationCoverLetterInput,
): string {
  const { candidate } = input;
  const orNone = (value: string | null | undefined) =>
    value?.trim() ?? "(none)";
  const jobDescription = input.jobDescription.trim();
  const softSkills = candidate.softSkills?.filter((s) => s.trim()) ?? [];
  const highlights = candidate.highlights?.filter((s) => s.trim()) ?? [];

  return `
POSITION: ${input.position}
COMPANY: ${input.companyName}
COMPANY_DESCRIPTION: ${orNone(input.companyDescription)}
LOCATION: ${orNone(input.location)}
SALARY: ${orNone(input.salary)}
APPLICATION_NOTES: ${orNone(input.notes)}

CANDIDATE:
- fullName: ${candidate.fullName}
- degree: ${orNone(candidate.degree)}
- summary: ${orNone(candidate.summary)}
- email: ${orNone(candidate.email)}
- phone: ${orNone(candidate.phone)}
- linkedin: ${orNone(candidate.linkedin)}
- softSkills: ${softSkills.length > 0 ? softSkills.join(", ") : "(none)"}
- highlights: ${highlights.length > 0 ? highlights.join(" | ") : "(none)"}

JOB DESCRIPTION:
${jobDescription.length > 0 ? jobDescription : "(empty)"}
`.trim();
}
