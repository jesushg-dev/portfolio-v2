import type { SkillTypeType } from "@/utils/interfaces/types";

const SKILL_INITIALS: Record<string, string> = {
  JavaScript: "JS",
  TypeScript: "TS",
  "Tailwind CSS": "TW",
  "Material UI": "MUI",
  "Styled Components": "SC",
  "Apollo GraphQL": "GQL",
  "React Native": "RN",
  "SQL Server": "SQL",
  "Entity Framework": "EF",
  "Nest.js": "Ne",
  DevExpress: "DX",
  Bitbucket: "Bb",
  "VS Code": "VS",
};

const SKILL_COLORS: Record<string, string> = {
  JavaScript: "#F0DB4F",
  TypeScript: "#3D8BEF",
  React: "#61DAFB",
  "Next.js": "#3D8BEF",
  "Tailwind CSS": "#38BDF8",
  "C#": "#C084E0",
  ".NET": "#8B6FE8",
  "Node.js": "#6BC96F",
  MongoDB: "#4FBE7A",
  GraphQL: "#F063C4",
  Git: "#F5794E",
  Github: "#6B7280",
  Postman: "#F5875A",
  Azure: "#4DA6E8",
  HTML5: "#E44D26",
  CSS3: "#1572B6",
  Java: "#F0A050",
  PHP: "#9599D6",
  Firebase: "#F5B942",
  Vite: "#B99EF5",
  Prisma: "#8FA3C7",
};

export type SkillCategoryId = "frontend" | "backend" | "tools";

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
    types: ["BACKEND", "DEVOPS", "CYBERSECURITY"],
    dotClass: "bg-primary",
    indicatorClass: "bg-primary",
    borderClass: "border-primary",
  },
  {
    id: "tools",
    types: ["TOOLS"],
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
    { frontend: 0, backend: 0, tools: 0 } as Record<SkillCategoryId, number>,
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
