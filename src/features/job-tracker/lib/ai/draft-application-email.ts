import { z } from "zod";

import { extractEmailsFromText } from "@/features/job-tracker/lib/extract-apply-emails";

export const ApplicationEmailDraftSchema = z.object({
  applyToEmail: z.string().email().nullable(),
  recipientName: z.string().nullable(),
  subject: z.string().min(1),
  body: z.string().min(1),
  notes: z.string().nullable().optional(),
});

export type ApplicationEmailDraft = z.infer<typeof ApplicationEmailDraftSchema>;

export interface DraftApplicationEmailInput {
  position: string;
  companyName: string;
  companyEmail?: string | null;
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
  };
}

export function buildApplicationEmailSystemPrompt(): string {
  return `
You help a job seeker write a short, personalized application email (cover letter in email form) to send their CV.

LANGUAGE: Detect the job description locale ("en", "es", or "nl"). Write subject and body in that language only. Never mix languages.

RULES:
- Extract the best email address to send the CV to from the job description (or companyEmail hint).
- Infer a human recipient name when possible (e.g. carol@… → Carol). If unknown, use null and greet the hiring team.
- Subject: concise, includes role + candidate name.
- Body: brief (4–8 short lines). Show they read this specific posting: 1–2 truthful highlights that map to the JD (prefer a quantified achievement from the summary if present). Mirror a few JD keywords only when they are true. Encourage reading the attached CV. Close with a short professional sign-off. Do NOT include a contact signature block (name/email/phone/linkedin) — an HTML signature is appended automatically.
- If no email is found, set applyToEmail to null and explain in notes; still draft subject/body.
- Never invent companies, years of experience digits, metrics, or contact details not provided.
- Return ONLY JSON matching:
{
  "applyToEmail": "email@example.com" | null,
  "recipientName": "Carol" | null,
  "subject": "...",
  "body": "plain text with newlines",
  "notes": "optional note" | null
}
`.trim();
}

export function buildApplicationEmailUserPrompt(
  input: DraftApplicationEmailInput,
): string {
  const emailsInJd = extractEmailsFromText(input.jobDescription);
  const { candidate } = input;
  const orNone = (value: string | null | undefined) =>
    value?.trim() ?? "(none)";
  const jobDescription = input.jobDescription.trim();

  return `
POSITION: ${input.position}
COMPANY: ${input.companyName}
COMPANY_EMAIL_HINT: ${orNone(input.companyEmail)}
COMPANY_DESCRIPTION: ${orNone(input.companyDescription)}
LOCATION: ${orNone(input.location)}
SALARY: ${orNone(input.salary)}
APPLICATION_NOTES: ${orNone(input.notes)}
EMAILS_FOUND_IN_JD: ${emailsInJd.length > 0 ? emailsInJd.join(", ") : "(none)"}

CANDIDATE:
- fullName: ${candidate.fullName}
- degree: ${orNone(candidate.degree)}
- summary: ${orNone(candidate.summary)}
- email: ${orNone(candidate.email)}
- phone: ${orNone(candidate.phone)}
- linkedin: ${orNone(candidate.linkedin)}
- softSkills: ${(candidate.softSkills?.filter((s) => s.trim()).join(", ") ?? "") || "(none)"}

JOB DESCRIPTION:
${jobDescription.length > 0 ? jobDescription : "(empty)"}
`.trim();
}

/** Prefer JD emails, then company hint, then AI suggestion. */
export function resolveApplyToEmail(
  draft: ApplicationEmailDraft,
  jobDescription: string,
  companyEmail?: string | null,
): string | null {
  const fromJd = extractEmailsFromText(jobDescription)[0];
  if (fromJd) return fromJd;
  const hint = companyEmail?.trim().toLowerCase();
  if (hint?.includes("@")) return hint;
  return draft.applyToEmail?.trim().toLowerCase() ?? null;
}
