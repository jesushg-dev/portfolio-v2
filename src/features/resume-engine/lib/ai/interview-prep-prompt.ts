import type { InterviewPrepEventType } from "@/features/resume-engine/lib/interview-prep-result";

const EVENT_FOCUS: Record<InterviewPrepEventType, string> = {
  INTERVIEW: `This is a live interview. The FIRST question must be category "hire". Then about 7-8 more: 1 intro (who they are + what they do that stands out + where they are going), 3 behavioral STAR, 2 role/JD, 1 company-research grounded only in the JD (product, stack, or stated challenges — never invent news), 1 gap, 1 closing (they are asked if they have questions; the modelAnswer is 2-3 questions about the role's challenges that show real interest).`,
  TECHNICAL_TEST: `This is a technical test or live coding/architecture screen. The FIRST question must be category "hire". Then about 7 more: mostly "technical" and "role" (approach, debugging, stack from the CV). Include 1 honest gap. Prefer how they would solve over trivia.`,
  QUESTIONNAIRE: `This is a written questionnaire. The FIRST question must be category "hire". Then about 5-7 written prompts. Favor "role", "behavioral", and "closing".`,
  PHONE_CALL: `This is a short phone/recruiter screen. The FIRST question must be category "hire" (45-90 seconds spoken). Then about 5 more: "screening" and "intro", why this role, logistics-safe motivation, 1 role highlight.`,
  MEETING: `This is a meeting with hiring stakeholders (not a classic interview loop). The FIRST question must be category "hire". Then about 5-7 more: collaboration, stakeholder communication, "behavioral", culture fit, 1 closing question they should ask.`,
  FOLLOW_UP: `This is a follow-up after a previous touchpoint. The FIRST question must be category "hire" (tight recap of why they are the hire). Then about 5 more: recap talking points, clarifying questions to send, "closing" asks, how to address gaps without repeating the last conversation.`,
};

export function buildInterviewPrepSystemPrompt(
  eventType: InterviewPrepEventType,
  append: boolean,
  focusTools: string[] = [],
): string {
  const countRule = append
    ? `Return 4-6 NEW questions only. Do not repeat or paraphrase EXISTING QUESTIONS from the user message. Do NOT add another "hire" question.`
    : EVENT_FOCUS[eventType];

  const toolsRule =
    focusTools.length > 0
      ? `\n- TOOL-SPECIFIC DEEP DIVE: The candidate has requested a deep dive into the following tool(s)/technology(ies): ${focusTools.join(", ")}. Formulate deep, realistic technical scenarios (e.g., performance tuning, production debugging, concurrency/locking, architectural trade-offs, failure recovery, or real-world system design) directly relevant to how those tools are used in this job description. Set their category to "technical" or "role". Avoid basic syntax or textbook definition trivia.`
      : "";

  return `
You create a private interview-prep pack for a job seeker, tailored to one scheduled hiring event.

EVENT TYPE: ${eventType}
${countRule}

RULES:
- Use only facts from the structured resume and match analysis. Never invent employers, titles, degrees, metrics, or skills.
- Detect the interview language from the JOB DESCRIPTION (not the admin UI). Write every question, whyTheyAsk, modelAnswer, talkingPoints, evidenceFromCv, and avoid line in that language. Set "detectedLocale" to "en", "es", or "nl" to match.
- HIRE QUESTION — CRITICAL: Unless this is an append pass, questions[0] MUST have category "hire". Phrase it in the detected locale as the interviewer asking why they should hire / contract this person for THIS role (e.g. "Why should we hire you?", "¿Por qué deberíamos contratarte?", "Waarom zouden we jou aannemen?"). The modelAnswer is the winning pitch, not a biography: 60-90 seconds spoken, mapped to this JD's must-haves, with 2-3 truthful proofs from the CV (prefer quantified outcomes). Close on the value they add in the first 90 days. Do not invent metrics. This question is the priority of the whole pack.
- Intro answers (separate from hire) must follow: who you are + distinctive proof from the CV + direction toward this role.
- Answers must be STAR (Situation, Task, Action, Result) when the question is behavioral, role, or technical. Label those four parts in the modelAnswer in the detected language. Keep each modelAnswer under 180 words and write it to be spoken aloud (not an essay).
- Company-research answers may only use facts present in the job description (and company name). If the JD is thin, ask about the role's stated stack or problem instead of fabricating company lore.
- Closing: include questions the candidate should ask about the role, team, and hardest problems — not "what is the salary" as the only ask.
- Ground every answer in evidenceFromCv (role, company, or bullet). If a topic is a skill gap, coach an honest framing — do not claim the missing skill.
- talkingPoints: 3-5 short bullets the candidate can glance at.
- avoid: phrases or claims that would oversell or contradict the resume.${toolsRule}

RESPONSE FORMAT:
Return a single JSON object (no markdown fences):
{
  "detectedLocale": "en",
  "questions": [
    {
      "category": "hire",
      "question": "Why should we hire you?",
      "whyTheyAsk": "...",
      "modelAnswer": "...",
      "talkingPoints": ["..."],
      "evidenceFromCv": ["Role at Company — bullet"],
      "avoid": ["..."]
    }
  ]
}

category must be one of: "hire", "intro", "behavioral", "role", "gap", "closing", "technical", "screening".
`.trim();
}
