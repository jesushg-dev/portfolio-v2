import { MediaImage } from "@/components/shared/media-image";
import { Building2 } from "lucide-react";

interface SkillExperienceItemProps {
  role: string;
  company: string;
  dates?: string | null;
  companyLogoUrl?: string | null;
  compact?: boolean;
}

export function SkillExperienceItem({
  role,
  company,
  dates,
  companyLogoUrl,
  compact = false,
}: SkillExperienceItemProps) {
  const logoUrl = companyLogoUrl?.trim();
  const logoSize = compact ? "size-10" : "size-12 sm:size-14";
  const logoIconSize = compact ? "size-4" : "size-5";

  return (
    <article
      className={
        compact
          ? "group hover:bg-muted/50 flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors"
          : "group hover:bg-muted/40 flex items-start gap-4 rounded-xl px-3 py-4 transition-colors sm:gap-5 sm:px-4 sm:py-5"
      }
    >
      <div
        className={`bg-muted/50 relative flex ${logoSize} shrink-0 items-center justify-center overflow-hidden rounded-xl`}
      >
        {logoUrl ? (
          <MediaImage
            src={logoUrl}
            alt=""
            width={compact ? 40 : 56}
            height={compact ? 40 : 56}
            className="max-h-[70%] max-w-[70%] object-contain"
          />
        ) : (
          <Building2
            className={`text-muted-foreground ${logoIconSize}`}
            aria-hidden
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h3
              className={
                compact
                  ? "text-foreground text-sm leading-snug font-semibold tracking-tight"
                  : "text-foreground text-base leading-snug font-semibold tracking-tight"
              }
            >
              {role}
            </h3>
            <p
              className={
                compact
                  ? "text-primary mt-0.5 text-xs font-medium"
                  : "text-primary mt-1 text-sm font-medium"
              }
            >
              {company}
            </p>
          </div>

          {dates ? (
            <span
              className={
                compact
                  ? "text-muted-foreground shrink-0 text-xs tabular-nums"
                  : "text-muted-foreground shrink-0 text-xs font-medium tabular-nums sm:text-sm"
              }
            >
              {dates}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
