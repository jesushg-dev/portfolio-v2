import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { parseAiJsonResponse } from "@/features/resume-engine/lib/ai/parse-json-response";
import {
  AI_PROVIDER_MODELS,
  requireTenantAiApiKey,
  resolveAiProvider,
  type AiProviderName,
  type TenantAiCredentials,
} from "@/features/resume-engine/lib/ai/providers";

export const InterviewAnswerEvaluationSchema = z.object({
  score: z.number().int().min(1).max(10),
  verdict: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export type InterviewAnswerEvaluation = z.infer<
  typeof InterviewAnswerEvaluationSchema
>;

const MAX_TOKENS = 2048;

function buildEvaluationSystemPrompt(): string {
  return `You are an expert technical and behavioral hiring manager evaluating a job candidate's practice interview response.
Evaluate the candidate's spoken or written answer constructively against the target question and reference model answer.

Respond ONLY with valid JSON matching this schema:
{
  "score": <integer from 1 to 10>,
  "verdict": "<1-2 sentence concise overall verdict in the same language as the candidate's answer>",
  "strengths": ["<bullet 1: key strong points, metrics, or relevance>", "<bullet 2>"],
  "improvements": ["<bullet 1: missing elements, conciseness, or structuring advice>", "<bullet 2>"]
}

Guidelines:
- If the answer is in Spanish, write the verdict, strengths, and improvements in Spanish. If in English, write in English.
- Be encouraging yet rigorous and realistic.
- Rate 8-10 for answers following STAR/direct structure with concrete details.
- Rate 5-7 for partially complete answers lacking specifics or structure.
- Rate 1-4 for answers off-topic, evasive, or overly brief.`;
}

function buildEvaluationUserPrompt(input: {
  question: string;
  whyTheyAsk: string;
  modelAnswer: string;
  userAnswer: string;
  talkingPoints?: string[];
}): string {
  return `Target Interview Question:
"${input.question}"

Why Recruiters Ask This:
${input.whyTheyAsk}

Key Talking Points:
${(input.talkingPoints ?? []).map((tp) => `- ${tp}`).join("\n")}

Reference Model Answer:
${input.modelAnswer}

Candidate's Answer:
"""
${input.userAnswer}
"""

Provide your constructive evaluation in JSON now:`;
}

export async function evaluateInterviewAnswer(
  input: {
    question: string;
    whyTheyAsk: string;
    modelAnswer: string;
    userAnswer: string;
    talkingPoints?: string[];
  },
  credentials: TenantAiCredentials,
  providerName?: string,
): Promise<{ result: InterviewAnswerEvaluation; provider: AiProviderName }> {
  const provider = resolveAiProvider(credentials, providerName);
  const systemPrompt = buildEvaluationSystemPrompt();
  const userPrompt = buildEvaluationUserPrompt(input);
  let result: InterviewAnswerEvaluation;

  switch (provider) {
    case "claude": {
      const client = new Anthropic({
        apiKey: requireTenantAiApiKey(credentials, "claude"),
      });
      const response = await client.messages.create({
        model: AI_PROVIDER_MODELS.claude,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const text =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      result = InterviewAnswerEvaluationSchema.parse(parseAiJsonResponse(text));
      break;
    }
    case "openai":
    case "deepseek": {
      const isDeepseek = provider === "deepseek";
      const client = new OpenAI({
        apiKey: requireTenantAiApiKey(
          credentials,
          isDeepseek ? "deepseek" : "openai",
        ),
        ...(isDeepseek ? { baseURL: "https://api.deepseek.com" } : {}),
      });
      const response = await client.chat.completions.create({
        model: isDeepseek
          ? AI_PROVIDER_MODELS.deepseek
          : AI_PROVIDER_MODELS.openai,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
      const text = response.choices[0]?.message?.content ?? "{}";
      result = InterviewAnswerEvaluationSchema.parse(parseAiJsonResponse(text));
      break;
    }
    case "gemini": {
      const client = new GoogleGenAI({
        apiKey: requireTenantAiApiKey(credentials, "gemini"),
      });
      const response = await client.models.generateContent({
        model: AI_PROVIDER_MODELS.gemini,
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        config: { responseMimeType: "application/json" },
      });
      result = InterviewAnswerEvaluationSchema.parse(
        parseAiJsonResponse(response.text ?? "{}"),
      );
      break;
    }
    default: {
      const exhaustiveCheck: never = provider;
      throw new Error(`Unknown AI provider: ${String(exhaustiveCheck)}`);
    }
  }

  return { result, provider };
}
