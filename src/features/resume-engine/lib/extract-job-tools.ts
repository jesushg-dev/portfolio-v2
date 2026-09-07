const COMMON_TECH_KEYWORDS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Svelte",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "C#",
  ".NET",
  "PHP",
  "Ruby",
  "Swift",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "SQLite",
  "Prisma",
  "TypeORM",
  "Drizzle",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Terraform",
  "GraphQL",
  "REST",
  "gRPC",
  "Kafka",
  "RabbitMQ",
  "Tailwind",
  "CSS",
  "HTML",
  "Git",
  "CI/CD",
  "GitHub Actions",
  "Jest",
  "Playwright",
  "Cypress",
  "Vitest",
  "Webpack",
  "Vite",
  "Turborepo",
  "Next-Intl",
  "Zod",
  "Redux",
  "Zustand",
  "TanStack Query",
  "tRPC",
  "Microservices",
  "Serverless",
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extracts and normalizes technical tools, languages, frameworks, and databases
 * from a job description, matched keywords, and candidate CV skills.
 */
export function extractJobTools(
  jobDescription: string,
  candidateSkills: string[] = [],
  matchAnalysisSkills: string[] = [],
): string[] {
  if (!jobDescription || jobDescription.trim().length === 0) {
    return [];
  }

  const jdText = jobDescription;
  const foundMap = new Map<string, string>(); // lowercase -> display name

  // 1. Check all candidate skills & match analysis skills against JD
  const combinedCandidates = [
    ...candidateSkills,
    ...matchAnalysisSkills,
    ...COMMON_TECH_KEYWORDS,
  ];

  for (const rawSkill of combinedCandidates) {
    const trimmed = rawSkill.trim();
    if (trimmed.length < 2) continue;

    const lower = trimmed.toLowerCase();
    if (foundMap.has(lower)) continue;

    const escaped = escapeRegex(trimmed);
    // Boundary check that works for both alphanumeric and special names like C#, .NET, Next.js
    const regex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, "i");

    if (regex.test(jdText)) {
      foundMap.set(lower, trimmed);
    }
  }

  // Convert to unique array preserving display names
  const results = Array.from(foundMap.values());

  // Prioritize tools that appeared in matchAnalysis or candidateSkills first
  const candidateLower = new Set(
    [...candidateSkills, ...matchAnalysisSkills].map((s) => s.toLowerCase()),
  );

  return results.sort((a, b) => {
    const aInCandidate = candidateLower.has(a.toLowerCase());
    const bInCandidate = candidateLower.has(b.toLowerCase());
    if (aInCandidate && !bInCandidate) return -1;
    if (!aInCandidate && bInCandidate) return 1;
    return a.localeCompare(b);
  });
}
