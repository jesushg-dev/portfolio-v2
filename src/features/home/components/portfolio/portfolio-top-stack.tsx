import type { FC } from "react";
import { useMemo } from "react";
import { Link } from "@/i18n/routing";
import type { ProjectType } from "@/utils/interfaces/types";
import SkillIcon from "@/features/home/components/skills/skill-icon";

interface PortfolioTopStackProps {
  projects: ProjectType[];
  title: string;
  projectsWord: string;
}

export const PortfolioTopStack: FC<PortfolioTopStackProps> = ({
  projects,
  title,
  projectsWord,
}) => {
  const topTech = useMemo(() => {
    const counts: Record<string, { count: number; image?: string | null }> = {};
    for (const project of projects) {
      if (!project.skills) continue;
      for (const skill of project.skills) {
        if (!counts[skill.title]) {
          counts[skill.title] = { count: 0, image: skill.image };
        }
        counts[skill.title].count += 1;
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, 8);
  }, [projects]);

  if (topTech.length === 0) return null;

  return (
    <div className="mt-12 text-center">
      <p className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
        {title}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {topTech.map(([techName, data]) => (
          <Link
            key={techName}
            href={{
              pathname: "/projects",
              query: { tech: techName },
            }}
            title={`${techName}: ${data.count} ${projectsWord}`}
            className="border-border bg-card text-foreground hover:border-primary/50 hover:text-primary inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-2xs transition-colors"
          >
            <SkillIcon
              image={data.image}
              title={techName}
              tile
              size="sm"
              className="size-5 rounded-md text-[10px]"
            />
            <span>{techName}</span>
            <span className="text-primary font-bold">{data.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
