"use client";

import { useCallback, type FC } from "react";
import { useLocale } from "next-intl";
import { Building2, Calendar } from "lucide-react";

import { MediaImage } from "@/components/shared/media-image";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import type { CertificateType } from "@/utils/interfaces/types";
import { formatIssuedDate } from "@/features/certifications/lib/format-issued-date";

export interface CertificateItemProps {
  id?: string;
  title: string;
  company: string;
  image?: string | null;
  url?: string | null;
  issuedDate?: number | null;
  idCredential?: string | null;
  type?: readonly string[] | string[];
  skills?: CertificateType["skills"];
  onPreview?: (cert: CertificateType) => void;
  userId?: string | null;
  appLanguageId?: string;
  certificationId?: string | null;
  createdAt?: Date;
}

const CertificateItem: FC<CertificateItemProps> = (props) => {
  const { image, title, issuedDate, company, skills, url, onPreview } = props;

  const locale = useLocale();
  const issuedDateText = formatIssuedDate(issuedDate, locale);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onPreview) {
        e.preventDefault();
        onPreview(props as unknown as CertificateType);
      }
    },
    [onPreview, props],
  );

  const imageSrc =
    image ??
    "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp";

  const techNames = (skills ?? []).map((s) => s.title).filter(Boolean);

  return (
    <a
      href={url ?? "#"}
      onClick={handleClick}
      target={url && !onPreview ? "_blank" : undefined}
      rel={url && !onPreview ? "noopener noreferrer" : undefined}
      className="group focus-visible:ring-primary block w-full cursor-pointer rounded-2xl text-left no-underline focus-visible:ring-2 focus-visible:outline-hidden"
    >
      {/* Thumbnail */}
      <div className="border-border/80 bg-card group-hover:border-primary/50 relative aspect-[1.414] w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 group-hover:shadow-xl">
        <MediaImage
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
      </div>

      {/* Meta: Company · Date */}
      <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs font-normal sm:text-sm">
        <Building2
          className="text-primary size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span>{company}</span>
        {issuedDateText ? (
          <>
            <span aria-hidden="true">·</span>
            <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{issuedDateText}</span>
          </>
        ) : null}
      </p>

      {/* Title */}
      <h3
        className="text-foreground group-hover:text-primary mt-1 line-clamp-2 text-lg leading-snug font-semibold tracking-tight transition-colors sm:text-xl"
        title={title}
      >
        {title}
      </h3>

      {/* Tags / Technologies with SkillIcon */}
      {skills && skills.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {skills.slice(0, 4).map((skill) => (
            <span
              key={skill.id}
              className="border-border/80 bg-muted/40 text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs"
            >
              <SkillIcon
                image={skill.image}
                title={skill.title}
                tile
                size="sm"
                className="size-3.5 rounded-xs text-[0.625rem]"
              />
              <span>{skill.title}</span>
            </span>
          ))}
          {skills.length > 4 ? (
            <span className="text-muted-foreground/80 pl-0.5 text-xs">
              +{skills.length - 4}
            </span>
          ) : null}
        </div>
      ) : techNames.length > 0 ? (
        <p className="text-muted-foreground mt-1.5 line-clamp-1 text-xs sm:text-sm">
          {techNames.join(" · ")}
        </p>
      ) : null}
    </a>
  );
};

export default CertificateItem;
