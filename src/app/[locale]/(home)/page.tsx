import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";

import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/server";
import About from "@/features/home/components/about";
import Contact from "@/features/home/components/contact";
import Experience from "@/features/home/components/experience";
import Hero from "@/features/home/components/hero";
import { PortfolioGridSkeleton } from "@/features/home/components/portfolio/portfolio-grid-skeleton";
import Skills from "@/features/home/components/skills";
import SoftSkills from "@/features/home/components/soft-skills";

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

const Portfolio = dynamic(
  () => import("@/features/home/components/portfolio"),
  { loading: () => <PortfolioFallback /> },
);

const SocialProof = dynamic(
  () => import("@/features/home/components/social-proof"),
  { loading: () => <SocialProofFallback /> },
);

export default async function Home() {
  const locale = await getLocale();
  const stats = await api.portfolio.getStatsPublic({ locale });

  return (
    <>
      <Hero stats={stats} />
      <About />
      <Experience />
      <Skills />
      <SoftSkills />
      <Portfolio />
      <SocialProof stats={stats} />
      <Contact />
    </>
  );
}
