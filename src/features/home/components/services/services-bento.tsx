"use client";

import type { FC } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, type Variants, useReducedMotion } from "motion/react";
import { MediaImage } from "@/components/shared/media-image";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  Code2,
  Database,
  Globe,
  Layers,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
  Zap,
} from "lucide-react";

export interface ServiceItem {
  id: string;
  type: string;
  image: string;
  icon?: string;
  statsValue?: string;
  featured?: boolean;
  order?: number;
  title: string;
  description: string;
  badge?: string;
  statsLabel?: string;
}

interface ServicesBentoProps {
  dbServices?: ServiceItem[];
}

const ICON_MAP: Record<
  string,
  FC<{ className?: string; "aria-hidden"?: boolean }>
> = {
  code: Code2,
  server: Server,
  smartphone: Smartphone,
  terminal: Terminal,
  shield: ShieldCheck,
  database: Database,
  zap: Zap,
  globe: Globe,
  layers: Layers,
};

function getVisualType(
  service: ServiceItem,
): "frontend" | "backend" | "mobile" | "devops" | "security" | "default" {
  const type = (service.type ?? "").toUpperCase();
  const icon = (service.icon ?? "").toLowerCase();

  if (type.includes("FRONTEND") || icon === "code") return "frontend";
  if (type.includes("BACKEND") || icon === "server" || icon === "database")
    return "backend";
  if (type.includes("MOBILE") || icon === "smartphone" || icon === "phone")
    return "mobile";
  if (type.includes("DEVOPS") || type.includes("TOOLS") || icon === "terminal")
    return "devops";
  if (
    type.includes("CYBERSECURITY") ||
    type.includes("SECURITY") ||
    icon === "shield"
  )
    return "security";
  return "default";
}

function getColSpan(index: number, total: number): string {
  if (total === 1) return "md:col-span-12";
  if (total === 2) return "md:col-span-6";
  if (index === 0) return "md:col-span-7";
  if (index === 1) return "md:col-span-5";
  return "md:col-span-4";
}

/* Micro-visual 1: Frontend browser window */
function FrontendVisual({ service }: { service: ServiceItem }) {
  const badgeText = service.badge;
  const metricText = service.statsValue
    ? `${service.statsValue}${service.statsLabel ? ` · ${service.statsLabel}` : ""}`
    : null;

  return (
    <div className="border-border/30 bg-card w-full max-w-sm rounded-xl border shadow-xs">
      <div className="border-border/20 flex items-center gap-1.5 border-b px-3 py-2">
        <span className="bg-border/60 size-2 rounded-full" aria-hidden="true" />
        <span className="bg-border/60 size-2 rounded-full" aria-hidden="true" />
        <span className="bg-border/60 size-2 rounded-full" aria-hidden="true" />
        <span className="bg-muted/80 ml-2 h-3.5 flex-1 rounded" />
      </div>
      <div className="space-y-2.5 p-3">
        {badgeText || metricText ? (
          <div className="flex items-center gap-2">
            {badgeText ? (
              <span className="a-ring bg-primary text-primary-foreground relative truncate rounded-lg px-3 py-1.5 text-xs font-semibold shadow-xs">
                {badgeText}
              </span>
            ) : null}
            {metricText ? (
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600">
                {metricText}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="bg-muted/60 h-2 w-3/4 rounded" />
        <div className="bg-muted/60 h-2 w-1/2 rounded" />
      </div>
    </div>
  );
}

/* Micro-visual 2: Backend API response cards */
function BackendVisual({ service }: { service: ServiceItem }) {
  const metricTime = service.statsValue;
  const statusLabel = service.statsLabel;

  const logs = [
    {
      code: "200",
      method: "GET",
      path: "/api/v1/health",
      time: metricTime,
      delay: undefined,
    },
    {
      code: "200",
      method: "POST",
      path: "/api/v1/auth",
      time: statusLabel,
      delay: "1.5s",
    },
    {
      code: "200",
      method: "GET",
      path: "/api/v1/data",
      time: service.badge,
      delay: "3s",
    },
  ].filter((log) => Boolean(log.time));

  return (
    <div className="flex w-full flex-col justify-center gap-2 font-mono text-[11px]">
      {(logs.length > 0
        ? logs
        : [
            {
              code: "200",
              method: "GET",
              path: "/api/v1/health",
              time: "200 OK",
              delay: undefined,
            },
          ]
      ).map((log) => (
        <div
          key={log.path}
          style={log.delay ? { animationDelay: log.delay } : undefined}
          className="a-blink border-border/30 bg-card flex items-center justify-between rounded-lg border px-3 py-1.5 shadow-2xs"
        >
          <span>
            <b className="font-bold text-emerald-600">{log.code}</b>{" "}
            {log.method} {log.path}
          </span>
          {log.time ? (
            <span className="text-muted-foreground">{log.time}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* Micro-visual 3: Mobile floating smartphone mockups */
function MobileVisual({ service }: { service: ServiceItem }) {
  return (
    <div className="flex items-end justify-center gap-3">
      <div className="a-float border-foreground/70 bg-card h-36 w-20 rounded-[1.3rem] border-4 p-1.5 shadow-sm">
        <div className="bg-primary h-5 rounded-lg" />
        <div className="bg-primary/15 mt-2 h-8 rounded-lg" />
        <div className="bg-muted/80 mt-1.5 h-2 w-3/4 rounded" />
        <div className="bg-muted/80 mt-1.5 h-2 w-1/2 rounded" />
      </div>
      <div
        style={{ animationDelay: "-2.5s" }}
        className="a-float border-foreground/70 bg-card -mb-6 h-36 w-20 rounded-[1.3rem] border-4 p-1.5 shadow-sm"
      >
        <div className="bg-primary/15 h-12 rounded-lg" />
        <div className="bg-muted/80 mt-2 h-2 w-full rounded" />
        <div className="bg-muted/80 mt-1.5 h-2 w-2/3 rounded" />
        <div className="bg-primary mt-2 h-5 rounded-lg">
          {service.statsValue ? (
            <span className="text-primary-foreground block text-center text-[9px] font-bold">
              {service.statsValue}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* Micro-visual 4: DevOps CI/CD pipeline */
function DevOpsVisual({ service }: { service: ServiceItem }) {
  const stage2 = service.badge ?? service.statsLabel;
  const stage3 = service.statsValue;

  return (
    <div className="relative flex w-full items-start justify-between px-2 sm:px-4">
      {/* Background track connecting node centers */}
      <span className="bg-border/40 absolute top-5 right-7 left-7 h-0.5 -translate-y-1/2 sm:right-9 sm:left-9" />

      {/* Traveling Dot bounded between Build and Deploy centers */}
      <div className="pointer-events-none absolute top-5 right-7 left-7 h-0.5 -translate-y-1/2 sm:right-9 sm:left-9">
        <span className="a-travel bg-primary shadow-primary/60 ring-card absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-xs ring-2" />
      </div>

      <div className="text-muted-foreground relative flex flex-col items-center gap-2 text-[11px] font-semibold">
        <span className="border-border/30 bg-card text-primary flex size-10 items-center justify-center rounded-full border shadow-2xs">
          <Code2 className="size-4" aria-hidden="true" />
        </span>
        Build
      </div>

      <div className="text-muted-foreground relative flex flex-col items-center gap-2 text-[11px] font-semibold">
        <span className="border-border/30 bg-card text-primary flex size-10 items-center justify-center rounded-full border shadow-2xs">
          <Check className="size-4" aria-hidden="true" />
        </span>
        {stage2 ?? "Test"}
      </div>

      <div className="text-muted-foreground relative flex flex-col items-center gap-2 text-[11px] font-semibold">
        <span className="border-border/30 bg-card text-primary flex size-10 items-center justify-center rounded-full border shadow-2xs">
          <Terminal className="size-4" aria-hidden="true" />
        </span>
        {stage3 ?? "Deploy"}
      </div>
    </div>
  );
}

/* Micro-visual 5: Cybersecurity shield & verification tags */
function SecurityVisual({ service }: { service: ServiceItem }) {
  const badge1 = service.statsValue;
  const badge2 = service.statsLabel;
  const badge3 = service.badge;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* Laser Sweep Scanner */}
      <div className="a-sweep pointer-events-none absolute inset-x-0 flex flex-col items-center">
        <div className="via-primary/15 h-10 w-full bg-gradient-to-b from-transparent to-transparent" />
        <div className="via-primary/70 h-px w-full bg-gradient-to-r from-transparent to-transparent shadow-[0_0_8px_var(--primary)]" />
        <div className="from-primary/15 h-10 w-full bg-gradient-to-b via-transparent to-transparent" />
      </div>

      <ShieldCheck
        className="text-primary/75 size-20"
        strokeWidth={1.3}
        aria-hidden="true"
      />
      {badge3 ? (
        <span className="border-border/30 bg-card absolute top-4 left-4 rounded-md border px-2 py-1 text-[11px] font-bold text-emerald-600 shadow-2xs">
          {badge3}
        </span>
      ) : null}
      {badge2 ? (
        <span className="border-border/30 bg-card absolute top-10 right-4 rounded-md border px-2 py-1 text-[11px] font-bold text-emerald-600 shadow-2xs">
          {badge2}
        </span>
      ) : null}
      {badge1 ? (
        <span className="border-border/30 bg-card absolute bottom-3 left-6 rounded-md border px-2 py-1 text-[11px] font-bold text-emerald-600 shadow-2xs">
          {badge1}
        </span>
      ) : null}
    </div>
  );
}

/* Fallback Micro-visual for custom services */
function DefaultVisual({
  IconComponent,
  service,
}: {
  IconComponent: FC<{ className?: string; "aria-hidden"?: boolean }>;
  service: ServiceItem;
}) {
  if (
    service.image &&
    (service.image.startsWith("/") || service.image.startsWith("http"))
  ) {
    return (
      <div className="relative size-full overflow-hidden rounded-2xl">
        <MediaImage
          src={service.image}
          alt={service.title}
          fill
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="bg-primary/10 absolute size-24 rounded-full blur-xl" />
      <IconComponent
        className="text-primary size-16 opacity-75"
        aria-hidden={true}
      />
      {service.statsValue ? (
        <span className="border-border/30 bg-card text-foreground absolute bottom-3 rounded-full border px-3 py-1 font-mono text-xs font-bold shadow-2xs">
          {service.statsValue} {service.statsLabel}
        </span>
      ) : null}
    </div>
  );
}

function getVisualContainerClasses(type: string): string {
  const base =
    "border-border/20 bg-muted/20 relative mb-6 flex h-44 overflow-hidden rounded-2xl border";
  switch (type) {
    case "mobile":
      return cn(base, "items-end justify-center pt-6 px-4");
    case "security":
      return cn(base, "items-center justify-center p-0");
    case "devops":
      return cn(base, "items-center justify-center px-4 sm:px-6");
    case "backend":
      return cn(base, "flex-col justify-center gap-2 p-4");
    default:
      return cn(base, "items-center justify-center p-4");
  }
}

export const ServicesBento: FC<ServicesBentoProps> = ({ dbServices = [] }) => {
  const t = useTranslations("main.services");
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--x");
    e.currentTarget.style.removeProperty("--y");
  };

  if (dbServices.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: true, margin: "-80px" }}
      className="grid w-full gap-5 md:grid-cols-12"
    >
      {dbServices.map((service, index) => {
        const IconComponent = ICON_MAP[service.icon ?? "code"] ?? Code2;
        const visualType = getVisualType(service);
        const colSpanClass = getColSpan(index, dbServices.length);

        return (
          <motion.article
            key={service.id}
            variants={itemVariants}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className={cn(
              "b-card-glow group border-border/30 bg-card hover:border-primary/30 relative flex flex-col justify-between overflow-hidden rounded-[2rem] border p-6 transition-all duration-300 hover:shadow-xl",
              colSpanClass,
            )}
          >
            {/* Top Interactive Micro-Visual */}
            <div className={getVisualContainerClasses(visualType)}>
              {visualType === "frontend" && (
                <FrontendVisual service={service} />
              )}
              {visualType === "backend" && <BackendVisual service={service} />}
              {visualType === "mobile" && <MobileVisual service={service} />}
              {visualType === "devops" && <DevOpsVisual service={service} />}
              {visualType === "security" && (
                <SecurityVisual service={service} />
              )}
              {visualType === "default" && (
                <DefaultVisual
                  IconComponent={IconComponent}
                  service={service}
                />
              )}
            </div>

            {/* Bottom Content Area */}
            <div>
              <div className="flex items-center gap-3">
                <span className="border-primary/15 bg-primary/8 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/30 relative z-10 flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-all duration-300 group-hover:shadow-md">
                  <IconComponent className="size-5" aria-hidden={true} />
                </span>
                <h3 className="text-foreground group-hover:text-primary text-xl font-bold tracking-tight transition-colors">
                  {service.title}
                </h3>
                {service.badge ? (
                  <span className="bg-primary/10 text-primary ml-auto hidden shrink-0 rounded-full px-3 py-1 text-xs font-bold sm:block">
                    {service.badge}
                  </span>
                ) : null}
              </div>

              <p className="text-muted-foreground mt-3 text-sm leading-relaxed sm:text-base">
                {service.description}
              </p>

              {service.badge ? (
                <span className="bg-primary/10 text-primary mt-3 inline-block shrink-0 rounded-full px-3 py-1 text-xs font-bold sm:hidden">
                  {service.badge}
                </span>
              ) : null}
            </div>
          </motion.article>
        );
      })}

      {/* Full-width CTA Banner */}
      <motion.div variants={itemVariants} className="md:col-span-12">
        <Link
          href="#contact"
          className="group focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/95 relative flex flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] p-8 transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none md:flex-row md:items-center md:p-10"
        >
          {/* Subtle grid pattern background */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage:
                "radial-gradient(60% 100% at 100% 50%, #000, transparent)",
              WebkitMaskImage:
                "radial-gradient(60% 100% at 100% 50%, #000, transparent)",
            }}
          />

          <div className="relative">
            <p className="text-primary-foreground/80 text-sm font-semibold tracking-wide sm:text-base">
              {t("items.contact.subtitle")}
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {t("items.contact.title")}
            </h3>
          </div>

          <span className="text-primary relative inline-flex items-center gap-3 rounded-full bg-white py-2 pr-2 pl-6 text-base font-bold shadow-md transition-transform group-hover:scale-[1.02]">
            {t("items.contact.cta")}
            <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight className="size-5" />
            </span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
};
