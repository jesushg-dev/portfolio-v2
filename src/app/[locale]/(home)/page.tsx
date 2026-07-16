import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";

import ViewportSection from "@/components/shared/viewport-section";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import Hero from "@/features/home/components/hero";
import { PortfolioGridSkeleton } from "@/features/home/components/portfolio/portfolio-grid-skeleton";

function AboutFallback() {
  return (
    <section aria-hidden className="mx-auto px-4 py-16 lg:container lg:px-20">
      <Skeleton className="mx-auto mb-8 h-10 w-64" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <Skeleton className="mt-8 h-40 w-full rounded-xl" />
    </section>
  );
}

function SkillsFallback() {
  return (
    <section aria-hidden className="mx-auto px-4 py-16 lg:container lg:px-20">
      <Skeleton className="mx-auto mb-8 h-10 w-48" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </section>
  );
}

function PortfolioFallback() {
  return (
    <section
      id="projects"
      aria-hidden
      className="mx-auto px-4 py-16 lg:container lg:px-20"
    >
      <Skeleton className="mb-8 h-10 w-64" />
      <PortfolioGridSkeleton count={3} />
    </section>
  );
}

function SocialProofFallback() {
  return (
    <section
      aria-hidden
      className="mx-auto px-4 py-16 lg:container lg:px-20 lg:py-20"
    >
      <Skeleton className="mb-6 h-8 w-72" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </section>
  );
}

function ExperienceFallback() {
  return (
    <section aria-hidden className="mx-auto px-4 py-16 lg:container lg:px-20">
      <Skeleton className="mx-auto mb-8 h-10 w-72" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </section>
  );
}

function SoftSkillsFallback() {
  return (
    <section aria-hidden className="mx-auto px-4 py-16 lg:container lg:px-20">
      <Skeleton className="mx-auto mb-8 h-10 w-72" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </section>
  );
}

function ContactFallback() {
  return (
    <section aria-hidden className="mx-auto max-w-6xl px-4 py-16">
      <Skeleton className="h-96 w-full rounded-2xl" />
    </section>
  );
}

const About = dynamic(() => import("@/features/home/components/about"));
const Skills = dynamic(() => import("@/features/home/components/skills"));
const Contact = dynamic(() => import("@/features/home/components/contact"));
const Portfolio = dynamic(() => import("@/features/home/components/portfolio"));
const SocialProof = dynamic(
  () => import("@/features/home/components/social-proof"),
);
const Experience = dynamic(
  () => import("@/features/home/components/experience"),
);
const SoftSkills = dynamic(
  () => import("@/features/home/components/soft-skills"),
);

export default async function Home() {
  const locale = await getLocale();
  const [stats, testimonials] = await Promise.all([
    api.portfolio.getStatsPublic({ locale }),
    api.portfolio.getTestimonialsPublic({ locale, limit: 3 }),
  ]);

  return (
    <>
      <Hero stats={stats} />

      <ViewportSection fallback={<AboutFallback />} minHeight="36rem">
        <About />
      </ViewportSection>

      <ViewportSection fallback={<ExperienceFallback />} minHeight="28rem">
        <Experience />
      </ViewportSection>

      <ViewportSection fallback={<SkillsFallback />} minHeight="32rem">
        <Skills />
      </ViewportSection>

      <ViewportSection fallback={<SoftSkillsFallback />} minHeight="28rem">
        <SoftSkills />
      </ViewportSection>

      <ViewportSection fallback={<PortfolioFallback />} minHeight="36rem">
        <Portfolio />
      </ViewportSection>

      <ViewportSection fallback={<SocialProofFallback />} minHeight="32rem">
        <SocialProof stats={stats} testimonials={testimonials} />
      </ViewportSection>

      <ViewportSection fallback={<ContactFallback />} minHeight="28rem">
        <Contact />
      </ViewportSection>
    </>
  );
}
