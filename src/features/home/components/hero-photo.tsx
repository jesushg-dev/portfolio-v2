import { Building2, ShieldCheck } from "lucide-react";

import HeroPhotoImage from "./hero-photo-image";

interface HeroData {
  fullName: string;
  photoUrl: string;
  imageAlt: string;
}

interface HeroPhotoExperience {
  company: string;
  role: string;
}

interface HeroPhotoProps {
  heroData: HeroData;
  experiences?: HeroPhotoExperience[];
  mttrBadge?: {
    value: string;
    label: string;
  };
}

export default function HeroPhoto({
  heroData,
  experiences = [],
  mttrBadge,
}: HeroPhotoProps) {
  const { fullName, photoUrl, imageAlt } = heroData;

  const nameParts = fullName.split(" ");
  const firstName = nameParts.slice(0, -1).join(" ") || fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const initials = `${firstName.charAt(0).toUpperCase()}${lastName ? lastName.charAt(0).toUpperCase() : ""}`;

  const topCompanies = (experiences || [])
    .map((e) => e.company)
    .filter(Boolean);
  const primaryCompaniesText =
    topCompanies.length > 0 ? topCompanies.slice(0, 2).join(" · ") : "";
  const secondaryCompanyText =
    topCompanies.length > 2 ? topCompanies[2] : experiences[0]?.role;

  const badgeValue = mttrBadge?.value;
  const badgeLabel = mttrBadge?.label;

  return (
    <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-[24rem] lg:max-w-[26rem]">
      {/* Spinning dashed orbital ring matching Untitled-1.html */}
      <span
        className="a-spin border-primary/30 pointer-events-none absolute -inset-5 rounded-full border border-dashed select-none sm:-inset-6"
        aria-hidden="true"
      />

      {/* Main Avatar Container */}
      <div className="bg-primary/20 relative aspect-square rounded-full p-2 shadow-[0_24px_70px_-12px_rgba(30,64,175,.35)] sm:p-2.5">
        <div className="bg-primary/10 relative h-full w-full overflow-hidden rounded-full">
          {photoUrl ? (
            <HeroPhotoImage photoUrl={photoUrl} imageAlt={imageAlt} />
          ) : (
            <span className="font-display text-primary flex h-full w-full items-center justify-center text-6xl font-bold sm:text-7xl">
              {initials}
            </span>
          )}
        </div>
      </div>

      {/* Floating Badge 1: Highlight Impact Metric (Bottom Left) */}
      {badgeValue ? (
        <div className="a-float border-border/80 bg-card/95 absolute -bottom-3 -left-2 flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-lg backdrop-blur-md sm:-bottom-2 sm:-left-6 sm:px-4 sm:py-3">
          <span className="border-primary/20 bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl border sm:size-10">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <strong className="text-foreground block text-base font-bold sm:text-lg">
              {badgeValue}
            </strong>
            {badgeLabel ? (
              <span className="text-muted-foreground text-sm font-medium">
                {badgeLabel}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Floating Badge 2: Enterprise Ecosystem (Top Right) */}
      {primaryCompaniesText ? (
        <div
          className="a-float border-border/80 bg-card/95 absolute -top-3 -right-2 flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 shadow-lg backdrop-blur-md sm:-top-4 sm:-right-6 sm:px-4 sm:py-3"
          style={{ animationDelay: "-2.5s" }}
        >
          <span className="border-primary/20 bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl border sm:size-10">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <strong className="text-foreground block text-sm font-bold sm:text-base">
              {primaryCompaniesText}
            </strong>
            {secondaryCompanyText ? (
              <span className="text-muted-foreground text-sm font-medium">
                {secondaryCompanyText}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
