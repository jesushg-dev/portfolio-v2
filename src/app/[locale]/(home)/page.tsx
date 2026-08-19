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
    <section aria-hidden className="mx-auto px-4 py-16 lg:container lg:px-20">
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

function ServicesFallback() {
  return (
    <section aria-hidden className="mx-auto px-4 py-16 lg:container lg:px-20">
      <Skeleton className="mx-auto mb-8 h-10 w-64" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-3xl md:col-span-2" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
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

const About = dynamic(() => import("@/features/home/components/about"), {
  loading: () => <AboutFallback />,
});
const Skills = dynamic(() => import("@/features/home/components/skills"), {
  loading: () => <SkillsFallback />,
});
const Services = dynamic(() => import("@/features/home/components/services"), {
  loading: () => <ServicesFallback />,
});
const Contact = dynamic(() => import("@/features/home/components/contact"), {
  loading: () => <ContactFallback />,
});
const Portfolio = dynamic(
  () => import("@/features/home/components/portfolio"),
  { loading: () => <PortfolioFallback /> },
);
const SocialProof = dynamic(
  () => import("@/features/home/components/social-proof"),
  { loading: () => <SocialProofFallback /> },
);
const Experience = dynamic(
  () => import("@/features/home/components/experience"),
  { loading: () => <ExperienceFallback /> },
);
const SoftSkills = dynamic(
  () => import("@/features/home/components/soft-skills"),
  { loading: () => <SoftSkillsFallback /> },
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

      <ViewportSection
        id="about"
        fallback={<AboutFallback />}
        minHeight="36rem"
      >
        <About />
      </ViewportSection>

      <ViewportSection
        id="experience"
        fallback={<ExperienceFallback />}
        minHeight="28rem"
      >
        <Experience />
      </ViewportSection>

      <ViewportSection
        id="skills"
        fallback={<SkillsFallback />}
        minHeight="32rem"
      >
        <Skills locale={locale} />
      </ViewportSection>

      <ViewportSection
        id="services"
        fallback={<ServicesFallback />}
        minHeight="32rem"
        requiresTrpc
      >
        <Services />
      </ViewportSection>

      <ViewportSection
        id="soft-skills"
        fallback={<SoftSkillsFallback />}
        minHeight="28rem"
      >
        <SoftSkills />
      </ViewportSection>

      <ViewportSection
        fallback={<PortfolioFallback />}
        minHeight="36rem"
        requiresTrpc
      >
        <Portfolio />
      </ViewportSection>

      <ViewportSection fallback={<SocialProofFallback />} minHeight="32rem">
        <SocialProof stats={stats} testimonials={testimonials} />
      </ViewportSection>

      <ViewportSection
        id="contact"
        fallback={<ContactFallback />}
        minHeight="28rem"
        requiresTrpc
      >
        <Contact />
      </ViewportSection>
    </>
  );
}
