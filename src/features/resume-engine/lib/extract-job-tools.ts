const COMMON_TECH_KEYWORDS = [
  "TypeScript",
  "JavaScript",
  "React",
  "React Native",
  "React Router",
  "Next.js",
  "Vue",
  "Angular",
  "AngularJS",
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

export function technologyNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Match whole spellings, preferring complete technology names over prefixes. */
export function createTechnologyMatcher(names: Iterable<string>) {
  const alternatives = [...new Set(Array.from(names, technologyNameKey))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((name) => escapeRegex(name).replace(/ /g, "[ \\t]+"))
    .join("|");
  const pattern = new RegExp(
    "(?<![\\p{L}\\p{N}_+#.])(?:" +
      (alternatives || "(?!)") +
      ")(?![\\p{L}\\p{N}_+#]|\\.[\\p{L}\\p{N}])",
    "giu",
  );
  return (text: string) =>
    Array.from(text.matchAll(pattern), ({ 0: name, index }) => ({
      name,
      index,
      key: technologyNameKey(name),
    }));
}

export function createResumeTechnologyMatcher(names: Iterable<string>) {
  const match = createTechnologyMatcher([...COMMON_TECH_KEYWORDS, ...names]);
  return (text: string) =>
    match(text).filter(
      ({ name, index }) =>
        !/^(go|rest|swift)$/u.test(name) &&
        !(
          name === "react" && /^\s+to\b/iu.test(text.slice(index + name.length))
        ),
    );
}

export function isCommonTechnology(name: string): boolean {
  const key = technologyNameKey(name);
  return COMMON_TECH_KEYWORDS.some(
    (technology) => technologyNameKey(technology) === key,
  );
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
