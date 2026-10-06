import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";

import ViewportSection from "@/components/shared/viewport-section";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import Hero from "@/features/home/components/hero";
import { PortfolioGridSkeleton } from "@/features/home/components/portfolio/portfolio-grid-skeleton";

function AboutFallback() {
  return (
    <section
      aria-hidden
      className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
    >
      <Skeleton className="mx-auto mb-12 h-10 w-64" />
      <div className="grid gap-10 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
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
    <div className="bg-muted/40 border-border/20 relative w-full overflow-hidden border-y">
      <section
        aria-hidden
        className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
      >
        <div className="mb-12 text-center sm:mb-14">
          <Skeleton className="mx-auto h-8 w-64 rounded-lg" />
          <Skeleton className="mx-auto mt-2 h-4 w-72 rounded-md" />
        </div>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[13.5rem_1fr] md:gap-10">
            <Skeleton className="h-6 w-28 md:ml-auto" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-[13.5rem_1fr] md:gap-10">
            <Skeleton className="h-6 w-28 md:ml-auto" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}

function SoftSkillsFallback() {
  return (
    <section
      aria-hidden
      className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-20"
    >
      <div className="grid w-full gap-12 lg:grid-cols-[5fr_7fr] lg:gap-14">
        <div className="space-y-4">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-16 w-full max-w-md rounded-lg" />
          <div className="mt-10 grid grid-cols-2 gap-4 border-t pt-6">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </div>
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
    <section
      aria-hidden
      className="mx-auto px-4 py-16 sm:px-6 lg:container lg:px-20 lg:py-24"
    >
      <Skeleton className="h-96 w-full rounded-3xl" />
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
      {/* 1. Hero (#top) */}
      <Hero stats={stats} />

      {/* 2. About Me (#about) */}
      <ViewportSection
        id="about"
        fallback={<AboutFallback />}
        minHeight="36rem"
      >
        <About />
      </ViewportSection>

      {/* 3. Services & Expertise (#services) */}
      <ViewportSection
        id="services"
        fallback={<ServicesFallback />}
        minHeight="32rem"
        requiresTrpc
      >
        <Services />
      </ViewportSection>

      {/* 4. Leadership & Impact (#leadership / #soft-skills) */}
      <ViewportSection
        id="soft-skills"
        fallback={<SoftSkillsFallback />}
        minHeight="28rem"
      >
        <SoftSkills />
      </ViewportSection>

      {/* 5. Testimonials & Social Proof (#testimonials) */}
      <ViewportSection fallback={<SocialProofFallback />} minHeight="32rem">
        <SocialProof stats={stats} testimonials={testimonials} />
      </ViewportSection>

      {/* 6. Technical Stack (#stack / #skills) */}
      <ViewportSection
        id="skills"
        fallback={<SkillsFallback />}
        minHeight="32rem"
      >
        <Skills locale={locale} />
      </ViewportSection>

      {/* 7. Professional Experience (#experience) */}
      <ViewportSection
        id="experience"
        fallback={<ExperienceFallback />}
        minHeight="28rem"
      >
        <Experience />
      </ViewportSection>

      {/* 8. Portfolio / Featured Projects (#portfolio) */}
      <ViewportSection
        fallback={<PortfolioFallback />}
        minHeight="36rem"
        requiresTrpc
      >
        <Portfolio />
      </ViewportSection>

      {/* 9. Contact (#contact) */}
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
