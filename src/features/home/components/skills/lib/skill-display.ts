import type { SkillTypeType } from "@/utils/interfaces/types";

const SKILL_INITIALS: Record<string, string> = {
  JavaScript: "JS",
  TypeScript: "TS",
  React: "Re",
  "Next.js": "N",
  "Tailwind CSS": "Tw",
  "Material UI": "M",
  "Styled Components": "Sc",
  "Apollo GraphQL": "Ap",
  "React Native": "RN",
  "SQL Server": "Sq",
  "Entity Framework": "EF",
  "Nest.js": "Ne",
  DevExpress: "DX",
  Bitbucket: "Bb",
  "VS Code": "VS",
  Docker: "Dk",
  Linux: "Lx",
  "CI/CD": "CI",
  Snyk: "Sn",
  OWASP: "OW",
  Playwright: "Pw",
  Redux: "Rx",
  Sass: "Ss",
  Bootstrap: "B",
  WebSockets: "WS",
  Android: "An",
  WinForms: "Wf",
  "ASP.NET Core": "AS",
  tRPC: "tR",
  "REST APIs": "Rt",
  Microservices: "Ms",
};

const SKILL_COLORS: Record<string, string> = {
  JavaScript: "#b8860b",
  TypeScript: "#3178c6",
  React: "#0ea5c4",
  "Next.js": "#111827",
  "Tailwind CSS": "#06b6d4",
  "Material UI": "#1976d2",
  "Styled Components": "#db7093",
  "Apollo GraphQL": "#311c87",
  "React Native": "#0ea5c4",
  "C#": "#7e57c2",
  ".NET": "#8b6fe8",
  "ASP.NET Core": "#512bd4",
  "SQL Server": "#cc2927",
  "Node.js": "#1f9d55",
  MongoDB: "#4fbe7a",
  GraphQL: "#f063c4",
  Git: "#f5794e",
  Github: "#6b7280",
  Postman: "#f5875a",
  Azure: "#0078d4",
  HTML5: "#e44d26",
  CSS3: "#7e57c2",
  Java: "#f0a050",
  PHP: "#9599d6",
  Firebase: "#f5b942",
  Vite: "#b99ef5",
  Prisma: "#8fa3c7",
  Docker: "#2496ed",
  Linux: "#111827",
  "CI/CD": "#475569",
  Snyk: "#4c4a73",
  OWASP: "#0f766e",
  Playwright: "#2e7d32",
  Redux: "#764abc",
  Sass: "#cd6799",
  Bootstrap: "#7952b3",
  WebSockets: "#475569",
  Android: "#1f9d55",
  WinForms: "#5b9a68",
  tRPC: "#398ccb",
  "REST APIs": "#475569",
  Microservices: "#475569",
};

export type SkillCategoryId =
  "architecture" | "backend" | "data" | "frontend" | "quality";

export const SKILL_CATEGORIES: {
  id: SkillCategoryId;
  types: SkillTypeType[];
  dotClass: string;
  indicatorClass: string;
  borderClass: string;
}[] = [
  {
    id: "frontend",
    types: ["FRONTEND", "MOBILE", "DESKTOP"],
    dotClass: "bg-primary",
    indicatorClass: "bg-primary",
    borderClass: "border-primary",
  },
  {
    id: "backend",
    types: ["BACKEND"],
    dotClass: "bg-primary",
    indicatorClass: "bg-primary",
    borderClass: "border-primary",
  },
  {
    id: "architecture",
    types: ["ARCHITECTURE"],
    dotClass: "bg-primary",
    indicatorClass: "bg-primary",
    borderClass: "border-primary",
  },
  {
    id: "data",
    types: ["DATA"],
    dotClass: "bg-primary",
    indicatorClass: "bg-primary",
    borderClass: "border-primary",
  },
  {
    id: "quality",
    types: ["QUALITY_DELIVERY", "DEVOPS", "TOOLS", "CYBERSECURITY"],
    dotClass: "bg-primary",
    indicatorClass: "bg-primary",
    borderClass: "border-primary",
  },
];

export function getSkillInitials(title: string): string {
  if (SKILL_INITIALS[title]) return SKILL_INITIALS[title];
  if (title.length <= 4) return title;
  return title
    .split(/[\s./-]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

export function getSkillBadgeColor(title: string): string {
  if (SKILL_COLORS[title]) return SKILL_COLORS[title];

  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 62%)`;
}

export function countSkillsByCategory(
  skills: { type: SkillTypeType }[],
): Record<SkillCategoryId, number> {
  return SKILL_CATEGORIES.reduce(
    (counts, category) => {
      counts[category.id] = skills.filter((skill) =>
        category.types.includes(skill.type),
      ).length;
      return counts;
    },
    { architecture: 0, backend: 0, data: 0, frontend: 0, quality: 0 } as Record<
      SkillCategoryId,
      number
    >,
  );
}

export function filterSkillsByCategory<T extends { type: SkillTypeType }>(
  skills: T[],
  categoryId: SkillCategoryId,
): T[] {
  const category = SKILL_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) return skills;
  return skills.filter((skill) => category.types.includes(skill.type));
}
