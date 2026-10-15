import type { FC } from "react";
import { User } from "lucide-react";

interface ProfileHeroPreviewProps {
  fullName: string;
  photoUrl: string;
  imageAlt: string;
  heroSubtitle: string;
  heroTagline: string;
  heroSummary: string;
  badgeLabel: string;
}

export const ProfileHeroPreview: FC<ProfileHeroPreviewProps> = ({
  fullName,
  photoUrl,
  imageAlt,
  heroSubtitle,
  heroTagline,
  heroSummary,
  badgeLabel,
}) => {
  const nameParts = fullName.trim().split(/\s+/);
  const firstName =
    nameParts.slice(0, -1).join(" ") || fullName.trim() || "John";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const initials = `${firstName.charAt(0).toUpperCase()}${lastName ? lastName.charAt(0).toUpperCase() : ""}`;

  return (
    <div className="bg-card text-card-foreground border-border/80 relative overflow-hidden rounded-2xl border p-5 shadow-xs sm:p-6">
      {/* Subtle radial glow matching hero */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(60%_70%_at_45%_0%,rgba(99,102,241,.15),transparent)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          {/* Availability badge */}
          {badgeLabel ? (
            <div className="border-primary/25 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
              <span
                className="bg-primary size-1.5 rounded-full"
                aria-hidden="true"
              />
              <span>{badgeLabel}</span>
            </div>
          ) : null}

          <div>
            <h3 className="text-foreground mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {firstName}{" "}
              {lastName ? (
                <span className="text-primary">{lastName}</span>
              ) : null}
            </h3>
            {heroSubtitle ? (
              <h4 className="text-foreground mt-1.5 text-base font-bold tracking-tight sm:text-lg">
                {heroSubtitle}
              </h4>
            ) : null}
          </div>

          {heroTagline ? (
            <p className="text-foreground text-sm leading-relaxed font-medium">
              {heroTagline}
            </p>
          ) : null}

          {heroSummary ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {heroSummary}
            </p>
          ) : null}
        </div>

        {/* Circular Avatar Container with Orbital Ring */}
        <div className="relative mx-auto shrink-0 md:mx-0">
          <div className="border-primary/30 pointer-events-none absolute -inset-2 rounded-full border border-dashed select-none" />
          <div className="bg-primary/20 relative size-24 rounded-full p-1 sm:size-28">
            <div className="bg-primary/10 relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={imageAlt || fullName || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : initials ? (
                <span className="text-primary text-2xl font-bold sm:text-3xl">
                  {initials}
                </span>
              ) : (
                <User className="text-primary/60 size-10" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
