export interface SkillMatchCandidate {
  key: string;
  title: string;
}

export interface CertificationMatchInput {
  translations: { locale: string; title: string }[];
  type?: string;
}

const TITLE_SKILL_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/react\s+native/i, "ReactNative"],
  [/next\.?js/i, "Nextjs"],
  [/react\.?js/i, "React"],
  [/graphql/i, "GraphQL"],
  [/typescript/i, "Typescript"],
  [/javascript/i, "Javascript"],
  [/\bapi\s+rest\b/i, "Javascript"],
  [/asp\.?net/i, "Dotnet"],
  [/\.net\b/i, "Dotnet"],
  [/azure/i, "Azure"],
  [/node\.?js/i, "Nodejs"],
  [/tailwind(?:\s+css)?/i, "Tailwind"],
  [/prisma/i, "Prisma"],
  [/bootstrap/i, "Bootstrap"],
  [/redux/i, "Redux"],
  [/firebase/i, "Firebase"],
  [/mysql/i, "Mysql"],
  [/mongo\s*db/i, "MongoDb"],
  [/express(?:\.js)?/i, "Express"],
  [/java(?!script)/i, "Java"],
  [/\bphp\b/i, "Php"],
  [/c#/i, "Csharp"],
  [/html\s*5?/i, "Html"],
  [/css\s*3?/i, "Css"],
  [/sass\b/i, "Sass"],
  [/material\s+ui/i, "Material"],
  [/styled[\s-]?components?/i, "Styled"],
  [/apollo/i, "Apollo"],
  [/git\b/i, "Git"],
  [/github/i, "Github"],
  [/postman/i, "Postman"],
  [/vite\b/i, "Vite"],
  [/android/i, "Android"],
  [/sql\s+server/i, "SqlServer"],
  [/entity\s+framework/i, "Entity"],
  [/swagger/i, "Swagger"],
  [/npm\b/i, "Npm"],
  [/yarn\b/i, "Yarn"],
  [/notion/i, "Notion"],
  [/bitbucket/i, "Bitbucket"],
  [/vscode|vs\s+code/i, "Vscode"],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function certificationTitleBlob(
  certification: CertificationMatchInput,
): string {
  const english =
    certification.translations.find((row) => row.locale === "en")?.title ?? "";
  const spanish =
    certification.translations.find((row) => row.locale === "es")?.title ?? "";
  return `${english} ${spanish}`;
}

/**
 * Infers portfolio skill keys from certification titles (English + Spanish).
 * Uses explicit technology patterns first, then whole-title word matches.
 */
export function matchCertificationSkillKeys(
  certification: CertificationMatchInput,
  skills: SkillMatchCandidate[],
  options: { maxSkills?: number } = {},
): string[] {
  const maxSkills = options.maxSkills ?? 4;
  const availableKeys = new Set(skills.map((skill) => skill.key));
  const blob = certificationTitleBlob(certification);
  const matched = new Set<string>();

  for (const [pattern, key] of TITLE_SKILL_PATTERNS) {
    if (pattern.test(blob) && availableKeys.has(key)) {
      matched.add(key);
    }
  }

  const sortedSkills = [...skills].sort(
    (left, right) => right.title.length - left.title.length,
  );

  for (const skill of sortedSkills) {
    if (skill.title.length < 3) continue;

    const pattern = new RegExp(
      `\\b${escapeRegExp(skill.title).replace(/\s+/g, "\\s+")}\\b`,
      "i",
    );
    if (pattern.test(blob)) {
      matched.add(skill.key);
    }
  }

  return Array.from(matched).slice(0, maxSkills);
}
