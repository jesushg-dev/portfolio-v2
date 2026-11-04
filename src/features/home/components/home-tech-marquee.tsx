import type { FC } from "react";
import SkillIcon from "@/features/home/components/skills/skill-icon";

export interface TechMarqueeItem {
  id?: string;
  title: string;
  image?: string | null;
}

export interface HomeTechMarqueeProps {
  items?: (string | TechMarqueeItem)[];
}

export const HomeTechMarquee: FC<HomeTechMarqueeProps> = ({ items }) => {
  const list: TechMarqueeItem[] = (items ?? [])
    .map((item) => (typeof item === "string" ? { title: item } : item))
    .filter((item) => item.title.trim().length > 0);
  if (list.length === 0) return null;

  const mid = Math.ceil(list.length / 2);
  const row1 = list.slice(0, mid);
  const row2 = list.slice(mid);

  const repeatCount1 = Math.max(2, Math.ceil(12 / (row1.length || 1)));
  const repeatCount2 = Math.max(2, Math.ceil(12 / (row2.length || 1)));
  const track1 = Array.from({ length: repeatCount1 }, () => row1).flat();
  const track2 = Array.from({ length: repeatCount2 }, () => row2).flat();

  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)] py-2 pb-14 select-none"
    >
      <div className="grid gap-3.5">
        {/* Forward track */}
        <div className="a-home-marquee">
          {track1.map((tech, i) => (
            <span
              key={`r1-${tech.title}-${i}`}
              className="border-border/70 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            >
              {tech.image ? (
                <SkillIcon
                  image={tech.image}
                  title={tech.title}
                  tile
                  size="sm"
                  className="size-5 rounded-md text-[0.625rem]"
                />
              ) : null}
              <span>{tech.title}</span>
            </span>
          ))}
        </div>

        {/* Reverse track */}
        <div className="a-home-marquee-reverse">
          {track2.map((tech, i) => (
            <span
              key={`r2-${tech.title}-${i}`}
              className="border-border/70 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
            >
              {tech.image ? (
                <SkillIcon
                  image={tech.image}
                  title={tech.title}
                  tile
                  size="sm"
                  className="size-5 rounded-md text-[0.625rem]"
                />
              ) : null}
              <span>{tech.title}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
