"use client";

import type { FC } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

/** Temporary showcase image — swap when final auth artwork is ready. */
const AUTH_SHOWCASE_IMAGE =
  "https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3233453_brzqcm.webp";

const AVATAR_SEEDS = [
  "auth-avatar-1",
  "auth-avatar-2",
  "auth-avatar-3",
  "auth-avatar-4",
  "auth-avatar-5",
] as const;

interface AuthShowcasePanelProps {
  variant?: "hero" | "community" | "trust";
}

const AuthShowcasePanel: FC<AuthShowcasePanelProps> = ({
  variant = "hero",
}) => {
  const t = useTranslations("auth.showcase");

  if (variant === "trust") {
    return (
      <div className="bg-muted border-border relative flex min-h-72 flex-col justify-center overflow-hidden rounded-2xl border p-8 md:min-h-96">
        <GridLines />
        <div className="relative z-10 space-y-4">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-xl">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="text-foreground text-xl font-medium tracking-tight">
            {t("trustTitle")}
          </h2>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            {t("trustDescription")}
          </p>
        </div>
      </div>
    );
  }

  if (variant === "community") {
    return (
      <div className="bg-muted border-border relative flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl border p-6 md:min-h-128 md:p-8">
        <GridLines />
        <div className="relative z-10">
          <AvatarStack label={t("avatarLabel")} />
          <h2 className="text-foreground mt-8 text-xl font-medium tracking-tight">
            {t("communityTitle")}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
            {t("communityDescription")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium">
              {t("badgePortfolio")}
            </span>
            <span className="bg-primary/10 text-primary rounded-md px-2 py-1 text-xs font-medium">
              {t("badgeCv")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border relative flex min-h-80 flex-col items-start justify-end overflow-hidden rounded-2xl border md:min-h-128">
      <Image
        src={AUTH_SHOWCASE_IMAGE}
        alt=""
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="from-background via-background/80 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent"
      />

      <div className="relative z-10 mb-2 flex flex-wrap items-center gap-2 p-4 md:p-8 md:pb-0">
        <span className="text-foreground bg-background/60 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
          {t("badgePortfolio")}
        </span>
        <span className="text-foreground bg-background/60 rounded-md px-2 py-1 text-xs backdrop-blur-sm">
          {t("badgeAdmin")}
        </span>
      </div>

      <div className="border-border/50 bg-background/70 relative z-10 m-4 max-w-sm rounded-xl border p-4 backdrop-blur-sm md:m-8">
        <h2 className="text-foreground text-base leading-relaxed font-medium">
          {t("heroQuote")}
        </h2>
        <p className="text-muted-foreground mt-4 text-sm">{t("heroAuthor")}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("heroRole")}{" "}
          <span className="text-foreground font-semibold">Jehg.</span>
        </p>
      </div>
    </div>
  );
};

function GridLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage: `
          linear-gradient(to right, var(--border) 1px, transparent 1px),
          linear-gradient(to bottom, var(--border) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }}
    />
  );
}

function AvatarStack({ label }: { label: string }) {
  return (
    <div className="flex items-center">
      {AVATAR_SEEDS.map((seed, index) => (
        <motion.div
          key={seed}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.08 }}
          className="border-background bg-muted relative size-10 overflow-hidden rounded-full border-2"
          style={{
            marginLeft: index === 0 ? 0 : -12,
            zIndex: AVATAR_SEEDS.length - index,
          }}
        >
          <Image
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
            alt=""
            width={40}
            height={40}
            className="size-full object-cover"
            unoptimized
          />
        </motion.div>
      ))}
      <span className="text-muted-foreground ml-3 text-xs">{label}</span>
    </div>
  );
}

export default AuthShowcasePanel;
