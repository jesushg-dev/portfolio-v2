import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import type { CvSection } from "@/lib/types";
import {
  DOCX_TAILOR_SYSTEM_PROMPT,
  STUDIO_DOCX_TAILOR_SYSTEM_PROMPT,
} from "@/features/resume-engine/lib/ai/docx-tailor-prompt";
import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type AiProviderName,
  type TenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";
import {
  buildDocxTailorUserPrompt,
  buildStudioDocxTailorUserPrompt,
  buildShrinkPromptPackage,
  type ShrinkFragment,
} from "@/features/resume-engine/lib/ai/prompt-package";
import type { TailorJobContext } from "@/features/resume-engine/lib/ai/tailor-job-context";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  CvDocxTailorResultSchema,
  applyEditsToSections,
  type CvDocxTailorResult,
  type TailoredResumeResult,
} from "@/features/resume-engine/lib/cv-docx-tailor-result";
import { validateTailorEdits } from "@/features/resume-engine/lib/ai/tailor-validator";
import {
  ShrinkResultSchema,
  type ShrinkResult,
} from "@/features/resume-engine/lib/ai/shrink-result";

async function tailorDocxWithClaude(
  sections: CvSection[],
  jobDescription: string,
  apiKey: string,
  draft?: CvImportDraft,
  jobContext?: TailorJobContext | null,
): Promise<CvDocxTailorResult> {
  const client = new Anthropic({ apiKey });
  const systemPrompt = draft
    ? STUDIO_DOCX_TAILOR_SYSTEM_PROMPT
    : DOCX_TAILOR_SYSTEM_PROMPT;
  const userPrompt = draft
    ? buildStudioDocxTailorUserPrompt(
        sections,
        draft,
        jobDescription,
        jobContext,
      )
    : buildDocxTailorUserPrompt(sections, jobDescription, jobContext);

  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return CvDocxTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorDocxWithOpenAI(
  sections: CvSection[],
  jobDescription: string,
  apiKey: string,
  draft?: CvImportDraft,
  baseURL?: string,
  model = AI_PROVIDER_MODELS.openai,
  jobContext?: TailorJobContext | null,
): Promise<CvDocxTailorResult> {
  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
  const systemPrompt = draft
    ? STUDIO_DOCX_TAILOR_SYSTEM_PROMPT
    : DOCX_TAILOR_SYSTEM_PROMPT;
  const userPrompt = draft
    ? buildStudioDocxTailorUserPrompt(
        sections,
        draft,
        jobDescription,
        jobContext,
      )
    : buildDocxTailorUserPrompt(sections, jobDescription, jobContext);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return CvDocxTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function tailorDocxWithGemini(
  sections: CvSection[],
  jobDescription: string,
  apiKey: string,
  draft?: CvImportDraft,
  jobContext?: TailorJobContext | null,
): Promise<CvDocxTailorResult> {
  const client = new GoogleGenAI({ apiKey });
  const systemPrompt = draft
    ? STUDIO_DOCX_TAILOR_SYSTEM_PROMPT
    : DOCX_TAILOR_SYSTEM_PROMPT;
  const userPrompt = draft
    ? buildStudioDocxTailorUserPrompt(
        sections,
        draft,
        jobDescription,
        jobContext,
      )
    : buildDocxTailorUserPrompt(sections, jobDescription, jobContext);

  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  return CvDocxTailorResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkWithClaude(
  fragments: ShrinkFragment[],
  apiKey: string,
): Promise<ShrinkResult> {
  const client = new Anthropic({ apiKey });
  const { systemPrompt, userPrompt } = buildShrinkPromptPackage(fragments);

  const response = await client.messages.create({
    model: AI_PROVIDER_MODELS.claude,
    max_tokens: 2048,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  return ShrinkResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkWithOpenAI(
  fragments: ShrinkFragment[],
  apiKey: string,
  baseURL?: string,
  model = AI_PROVIDER_MODELS.openai,
): Promise<ShrinkResult> {
  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
  const { systemPrompt, userPrompt } = buildShrinkPromptPackage(fragments);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "{}";
  return ShrinkResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkWithGemini(
  fragments: ShrinkFragment[],
  apiKey: string,
): Promise<ShrinkResult> {
  const client = new GoogleGenAI({ apiKey });
  const { systemPrompt, userPrompt } = buildShrinkPromptPackage(fragments);

  const response = await client.models.generateContent({
    model: AI_PROVIDER_MODELS.gemini,
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const text = response.text ?? "{}";
  return ShrinkResultSchema.parse(parseAiJsonResponse(text));
}

async function shrinkOverflowingRuns(
  credentials: TenantAiCredentials,
  provider: AiProviderName,
  fragments: ShrinkFragment[],
): Promise<ShrinkResult> {
  switch (provider) {
    case "claude":
      return shrinkWithClaude(
        fragments,
        requireTenantAiApiKey(credentials, "claude"),
      );
    case "openai":
      return shrinkWithOpenAI(
        fragments,
        requireTenantAiApiKey(credentials, "openai"),
      );
    case "deepseek":
      return shrinkWithOpenAI(
        fragments,
        requireTenantAiApiKey(credentials, "deepseek"),
        "https://api.deepseek.com",
        AI_PROVIDER_MODELS.deepseek,
      );
    case "gemini":
      return shrinkWithGemini(
        fragments,
        requireTenantAiApiKey(credentials, "gemini"),
      );
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }
}

const MAX_SHRINK_ATTEMPTS = 2;

function calculateYearsOfExperience(draft?: CvImportDraft): number | undefined {
  if (!draft?.experiences || draft.experiences.length === 0) return undefined;
  let earliestYear: number | null = null;
  const currentYear = new Date().getFullYear();
  for (const exp of draft.experiences) {
    if (exp.startDate) {
      const match = /^(\d{4})/.exec(exp.startDate);
      if (match) {
        const year = parseInt(match[1], 10);
        if (!earliestYear || year < earliestYear) earliestYear = year;
      }
    }
  }
  if (!earliestYear) return undefined;
  return Math.max(1, currentYear - earliestYear);
}

function emptyLastBulletOfOldestJob(
  sections: CvSection[],
  currentEditsMap: Map<string, string>,
): { emptiedRunId: string } | null {
  const expSection = sections.find((s) =>
    /experience|experiencia|ervaring/i.test(s.heading),
  );
  if (!expSection || expSection.paragraphs.length <= 1) return null;

  // Walk backwards from oldest bullet to find a job with >1 bullet
  for (let i = expSection.paragraphs.length - 1; i >= 0; i--) {
    const p = expSection.paragraphs[i];
    const run = p.runs[0];
    if (run) {
      const currentText = (currentEditsMap.get(run.id) ?? run.text).trim();
      if (currentText.length > 0) {
        currentEditsMap.set(run.id, "");
        return { emptiedRunId: run.id };
      }
    }
  }
  return null;
}

export async function tailorDocxResume(
  sections: CvSection[],
  jobDescription: string,
  credentials: TenantAiCredentials,
  providerName?: string,
  draft?: CvImportDraft,
  jobContext?: TailorJobContext | null,
  options?: { yearsOfExperience?: number },
): Promise<{ result: TailoredResumeResult; provider: AiProviderName }> {
  if (sections.length === 0) {
    throw new Error("No adaptable sections found in the DOCX.");
  }

  const provider = resolveAiProvider(credentials, providerName);

  let rawResult: CvDocxTailorResult;
  switch (provider) {
    case "claude":
      rawResult = await tailorDocxWithClaude(
        sections,
        jobDescription,
        requireTenantAiApiKey(credentials, "claude"),
        draft,
        jobContext,
      );
      break;
    case "openai":
      rawResult = await tailorDocxWithOpenAI(
        sections,
        jobDescription,
        requireTenantAiApiKey(credentials, "openai"),
        draft,
        undefined,
        AI_PROVIDER_MODELS.openai,
        jobContext,
      );
      break;
    case "deepseek":
      rawResult = await tailorDocxWithOpenAI(
        sections,
        jobDescription,
        requireTenantAiApiKey(credentials, "deepseek"),
        draft,
        "https://api.deepseek.com",
        AI_PROVIDER_MODELS.deepseek,
        jobContext,
      );
      break;
    case "gemini":
      rawResult = await tailorDocxWithGemini(
        sections,
        jobDescription,
        requireTenantAiApiKey(credentials, "gemini"),
        draft,
        jobContext,
      );
      break;
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  // 1. Extract edits directly from LLM response
  const initialEdits = rawResult.edits;

  const effectiveYears =
    options?.yearsOfExperience ?? calculateYearsOfExperience(draft);

  // 2. Validate with pure post-LLM validator (E1 - E8)
  let validation = validateTailorEdits({
    originalSections: sections,
    sourceDraft: draft,
    jobDescription,
    edits: initialEdits,
    yearsOfExperience: effectiveYears,
  });

  const currentEditsMap = new Map<string, string>();
  for (const edit of validation.acceptedEdits) {
    currentEditsMap.set(edit.id, edit.text);
  }

  // 3. Repair loop (shrink) for over-budget runs (max 2 iterations)
  for (let attempt = 0; attempt < MAX_SHRINK_ATTEMPTS; attempt++) {
    if (validation.needsShrink.length === 0) break;

    try {
      const fragments: ShrinkFragment[] = validation.needsShrink.map((c) => ({
        id: c.id,
        text: c.text,
        budget: c.budget,
        currentLength: c.currentLength,
        role: c.role,
      }));

      const shrink = await shrinkOverflowingRuns(
        credentials,
        provider,
        fragments,
      );

      const shrinkValidation = validateTailorEdits({
        originalSections: sections,
        sourceDraft: draft,
        jobDescription,
        edits: shrink.runs
          .filter((r) => !r.unfit)
          .map((r) => ({ id: r.id, text: r.text })),
      });

      for (const edit of shrinkValidation.acceptedEdits) {
        currentEditsMap.set(edit.id, edit.text);
      }

      // Re-validate
      const prospectiveEdits = Array.from(currentEditsMap.entries()).map(
        ([id, text]) => ({ id, text }),
      );
      validation = validateTailorEdits({
        originalSections: sections,
        sourceDraft: draft,
        jobDescription,
        edits: prospectiveEdits,
        yearsOfExperience: effectiveYears,
      });
    } catch {
      break;
    }
  }

  // 4. Deterministic fallback if still over budget: empty oldest job's last bullet
  if (validation.needsShrink.length > 0) {
    emptyLastBulletOfOldestJob(sections, currentEditsMap);

    const prospectiveEdits = Array.from(currentEditsMap.entries()).map(
      ([id, text]) => ({ id, text }),
    );
    validation = validateTailorEdits({
      originalSections: sections,
      sourceDraft: draft,
      jobDescription,
      edits: prospectiveEdits,
      yearsOfExperience: effectiveYears,
    });
  }

  // 5. Build final result with accepted edits and full sections
  const finalEdits = Array.from(currentEditsMap.entries()).map(
    ([id, text]) => ({
      id,
      text,
    }),
  );
  const finalSections = applyEditsToSections(finalEdits, sections);

  const result: TailoredResumeResult = {
    ...rawResult,
    edits: finalEdits,
    sections: finalSections,
    sourceWarnings: [
      ...(rawResult.sourceWarnings ?? []),
      ...validation.warnings,
    ],
  };

  return { result, provider };
}
