"use client";

import { useCallback, type FC, type PointerEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  ExternalLink,
  GraduationCap,
  ZoomIn,
  Award,
  CheckCircle2,
  Monitor,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  ArrowUpRight,
  Zap,
} from "lucide-react";

import { MediaImage } from "@/components/shared/media-image";
import SkillIcon from "@/features/home/components/skills/skill-icon";
import type { CertificateType } from "@/utils/interfaces/types";
import { formatIssuedDate } from "@/features/certifications/lib/format-issued-date";

const TYPE_ICONS: Record<string, typeof Monitor> = {
  FRONTEND: Monitor,
  BACKEND: Server,
  CYBERSECURITY: ShieldCheck,
  DEVOPS: Terminal,
  SOFTSKILLS: Users,
};

const STACK_TYPE_LABELS: Record<string, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  CYBERSECURITY: "Cybersecurity",
  DEVOPS: "DevOps",
  SOFTSKILLS: "Soft Skills",
};

const MAX_TECH = 5;

const actionButtonClass =
  "flex size-10 items-center justify-center rounded-xl border border-border bg-card/90 text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 shadow-2xs cursor-pointer";

interface CertificateTopBadgesProps {
  typeLabel: string;
  TypeIcon: typeof Monitor;
  company: string;
}

export function CertificateTopBadges({
  typeLabel,
  TypeIcon,
  company,
}: CertificateTopBadgesProps) {
  return (
    <>
      <div className="absolute top-4 left-4 z-10">
        <span className="border-border/40 bg-card/95 text-foreground ring-foreground/10 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide uppercase shadow-xs ring-1 backdrop-blur-md">
          <TypeIcon
            className="text-primary size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{typeLabel}</span>
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <span className="border-border/40 bg-card/95 text-foreground ring-foreground/10 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-xs ring-1 backdrop-blur-md">
          <GraduationCap
            className="text-primary size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span className="max-w-28 truncate">{company}</span>
        </span>
      </div>
    </>
  );
}

interface CertificateCoverMediaProps {
  imageSrc: string;
  title: string;
  url?: string;
  previewLabel: string;
  viewLabel: string;
  onPreviewClick: () => void;
  typeLabel: string;
  TypeIcon: typeof Monitor;
  company: string;
}

export function CertificateCoverMedia({
  imageSrc,
  title,
  url,
  previewLabel,
  viewLabel,
  onPreviewClick,
  typeLabel,
  TypeIcon,
  company,
}: CertificateCoverMediaProps) {
  return (
    <div className="border-border bg-muted/20 relative flex aspect-video items-center justify-center overflow-hidden border-b p-3">
      {/* Ambient background reflection blur of the certificate image */}
      <div
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-xl"
        style={{ backgroundImage: `url(${imageSrc})` }}
        aria-hidden="true"
      />

      {/* Floating Top Badges */}
      <CertificateTopBadges
        typeLabel={typeLabel}
        TypeIcon={TypeIcon}
        company={company}
      />

      {/* Framed Certificate Document Preview */}
      <div className="border-border/80 bg-background/95 relative flex h-full w-full max-w-[21rem] items-center justify-center overflow-hidden rounded-xl border p-2 shadow-md transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover/card:scale-105">
        <MediaImage
          src={imageSrc}
          width={480}
          height={320}
          alt={title}
          className="h-full w-full rounded-md object-contain"
        />
      </div>

      {/* Hover Action Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-black/45 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover/card:opacity-100">
        <button
          type="button"
          onClick={onPreviewClick}
          aria-label={`${previewLabel} — ${title}`}
          className="bg-card/95 text-foreground hover:bg-card hover:text-primary flex size-11 cursor-pointer items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <ZoomIn className="size-5" aria-hidden="true" />
        </button>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} — ${viewLabel}`}
            className="bg-card/95 text-foreground hover:bg-card hover:text-primary flex size-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
          >
            <ExternalLink className="size-5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

interface CertificateHighlightChipsProps {
  verifyLabel: string;
  idCredential?: string | null;
}

export function CertificateHighlightChips({
  verifyLabel,
  idCredential,
}: CertificateHighlightChipsProps) {
  return (
    <ul className="mt-3.5 flex flex-wrap gap-2" aria-label="Key highlights">
      <li className="bg-primary/10 text-primary inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs leading-none font-semibold">
        <Zap className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{verifyLabel}</span>
      </li>
      {idCredential ? (
        <li className="border-border bg-muted/50 text-foreground inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs leading-none">
          <Award className="text-primary size-3 shrink-0" aria-hidden="true" />
          <span className="max-w-36 truncate">ID: {idCredential}</span>
        </li>
      ) : null}
    </ul>
  );
}

interface CertificateMetaLineProps {
  issuedDateText: string;
}

export function CertificateMetaLine({
  issuedDateText,
}: CertificateMetaLineProps) {
  if (!issuedDateText) return null;
  return (
    <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <Calendar
          className="text-primary size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span>{issuedDateText}</span>
      </span>
    </div>
  );
}

interface CertificateTechRowProps {
  skills?: CertificateType["skills"];
  verifyLabel: string;
  company: string;
}

export function CertificateTechRow({
  skills,
  verifyLabel,
  company,
}: CertificateTechRowProps) {
  const shownSkills = (skills ?? []).slice(0, MAX_TECH);
  const restSkillsCount = (skills ?? []).length - MAX_TECH;

  if (shownSkills.length > 0) {
    return (
      <ul
        className="mt-auto flex flex-wrap gap-2 pt-5"
        aria-label="Technologies"
      >
        {shownSkills.map((skill) => (
          <li
            key={skill.id}
            className="border-border bg-muted/50 text-foreground flex items-center gap-1.5 rounded-lg border py-1 pr-2.5 pl-1 text-xs font-medium"
          >
            <SkillIcon
              image={skill.image}
              title={skill.title}
              tile
              size="sm"
              className="size-6 rounded-lg text-xs"
            />
            <span className="capitalize">{skill.title}</span>
          </li>
        ))}
        {restSkillsCount > 0 ? (
          <li
            title={(skills ?? [])
              .slice(MAX_TECH)
              .map((s) => s.title)
              .join(", ")}
            className="border-border bg-muted/50 text-muted-foreground flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold"
          >
            +{restSkillsCount}
          </li>
        ) : null}
      </ul>
    );
  }

  return (
    <div className="mt-auto flex flex-wrap gap-2 pt-5">
      <span className="border-border bg-muted/50 text-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium">
        <CheckCircle2
          className="text-primary size-3.5 shrink-0"
          aria-hidden="true"
        />
        <span>{verifyLabel}</span>
      </span>
      <span className="border-border bg-muted/50 text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium">
        <span>{company} Certified</span>
      </span>
    </div>
  );
}

interface CertificateActionFooterProps {
  certificateUrl: string;
  title: string;
  seeCertificateLabel: string;
  previewLabel: string;
  onPreviewClick: () => void;
}

export function CertificateActionFooter({
  certificateUrl,
  title,
  seeCertificateLabel,
  previewLabel,
  onPreviewClick,
}: CertificateActionFooterProps) {
  return (
    <div className="border-border mt-5 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        {certificateUrl ? (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:text-primary/80 group/cta inline-flex cursor-pointer items-center gap-2 text-sm font-bold transition-colors"
          >
            <span>{seeCertificateLabel}</span>
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        ) : (
          <button
            type="button"
            onClick={onPreviewClick}
            className="text-primary hover:text-primary/80 group/cta inline-flex cursor-pointer items-center gap-2 text-sm font-bold transition-colors"
          >
            <span>{previewLabel}</span>
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
        )}

        {/* Secondary Action Buttons */}
        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviewClick}
            aria-label={`${previewLabel}: ${title}`}
            title={`${previewLabel}: ${title}`}
            className={actionButtonClass}
          >
            <ZoomIn className="text-primary size-4.5" aria-hidden="true" />
          </button>
          {certificateUrl ? (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${seeCertificateLabel}: ${title}`}
              title={`${seeCertificateLabel}: ${title}`}
              className={actionButtonClass}
            >
              <ExternalLink className="size-4.5" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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
  const {
    image,
    title,
    issuedDate,
    url = "",
    company,
    idCredential,
    type,
    skills,
    onPreview,
  } = props;

  const locale = useLocale();
  const t = useTranslations("certification");
  const issuedDateText = formatIssuedDate(issuedDate, locale);
  const certificateUrl = url?.trim() ?? "";

  const primaryType = (type?.[0] ?? "").toUpperCase();
  const typeLabel =
    STACK_TYPE_LABELS[primaryType] ?? (primaryType || "Certification");
  const TypeIcon = TYPE_ICONS[primaryType] ?? Award;

  const handlePointerMove = useCallback((e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  }, []);

  const handlePointerLeave = useCallback((e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--x");
    e.currentTarget.style.removeProperty("--y");
  }, []);

  const handlePreviewClick = useCallback(() => {
    onPreview?.(props as unknown as CertificateType);
  }, [onPreview, props]);

  const imageSrc =
    image ??
    "https://res.cloudinary.com/js-media/image/upload/v1691171515/portfolio/certificates/placeholder_tovcyh.webp";

  return (
    <article
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        backgroundImage:
          "radial-gradient(circle 24rem at var(--x, 100%) var(--y, 100%), color-mix(in srgb, var(--primary) 12%, transparent), transparent 70%)",
      }}
      className="group/card border-border bg-card text-card-foreground hover:border-primary/50 relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] border shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* Interactive Cursor Surface Glow Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px z-10 rounded-[2rem] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), color-mix(in srgb, var(--primary) 22%, transparent), transparent 75%)",
        }}
        aria-hidden="true"
      />

      {/* Interactive Border Glow Accent */}
      <div
        className="pointer-events-none absolute -inset-px z-20 rounded-[2rem] border border-transparent transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          maskImage:
            "radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), black, transparent 80%)",
          border: "1.5px solid var(--primary)",
        }}
        aria-hidden="true"
      />

      {/* Cover Media Container */}
      <CertificateCoverMedia
        imageSrc={imageSrc}
        title={title}
        url={certificateUrl}
        previewLabel={t("catalog.preview")}
        viewLabel={t("seeCertificate")}
        onPreviewClick={handlePreviewClick}
        typeLabel={typeLabel}
        TypeIcon={TypeIcon}
        company={company}
      />

      {/* Card Content Body */}
      <div className="relative z-10 flex flex-1 flex-col p-6">
        <h3
          className="text-foreground group-hover/card:text-primary line-clamp-2 min-h-[3.5rem] text-xl font-bold tracking-tight transition-colors"
          title={title}
        >
          {title}
        </h3>

        <CertificateMetaLine issuedDateText={issuedDateText} />

        <CertificateHighlightChips
          verifyLabel={t("catalog.verify")}
          idCredential={idCredential}
        />

        <CertificateTechRow
          skills={skills}
          verifyLabel={t("catalog.verify")}
          company={company}
        />

        <CertificateActionFooter
          certificateUrl={certificateUrl}
          title={title}
          seeCertificateLabel={t("seeCertificate")}
          previewLabel={t("catalog.preview")}
          onPreviewClick={handlePreviewClick}
        />
      </div>
    </article>
  );
};

export default CertificateItem;
