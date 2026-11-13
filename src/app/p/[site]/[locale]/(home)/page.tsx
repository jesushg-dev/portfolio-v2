import { getPublicLocale } from "@/lib/public-site/locale";
import { api } from "@/trpc/server";
import Hero from "@/features/home/components/hero";
import { HomeTechMarquee } from "@/features/home/components/home-tech-marquee";
import Portfolio from "@/features/home/components/portfolio";
import Experience from "@/features/home/components/experience";
import Services from "@/features/home/components/services";
import Skills from "@/features/home/components/skills";
import SocialProof from "@/features/home/components/social-proof";
import SoftSkills from "@/features/home/components/soft-skills";
import Contact from "@/features/home/components/contact";
import HomeSection from "@/features/home/components/home-section";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickPublicRouteMessages } from "@/lib/public-site/messages";
import { getCachedSoftSkillsPublic } from "@/lib/soft-skills/get-cached-soft-skills-public";
import { SITE_URL } from "@/lib/seo/site";

export { generateMetadata } from "./metadata";

export default async function Home() {
  const locale = await getPublicLocale();
  const [stats, testimonials, messages, skills, softSkills] = await Promise.all(
    [
      api.portfolio.getStatsPublic({ locale }),
      api.portfolio.getTestimonialsPublic({ locale, limit: 3 }),
      getMessages({ locale }),
      api.portfolio.getSkills({ locale }),
      getCachedSoftSkillsPublic(locale),
    ],
  );

  const personJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Jesús Hernández Portfolio",
        description: "Full-Stack Software Engineer & Solutions Architect",
        inLanguage: locale,
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name: "Jesús Hernández",
        url: SITE_URL,
        jobTitle: "Full-Stack Software Engineer",
        sameAs: [
          "https://github.com/jesushg",
          "https://linkedin.com/in/jesushg",
          "https://twitter.com/jesus_hg",
        ],
        knowsAbout: skills.map((s) => s.title),
      },
    ],
  };

  return (
    <NextIntlClientProvider
      messages={pickPublicRouteMessages(messages, "home")}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Hero stats={stats} />
      <HomeTechMarquee items={skills} />

      <HomeSection id="portfolio" estimatedHeight="36rem">
        <Portfolio />
      </HomeSection>

      <HomeSection id="experience" estimatedHeight="36rem">
        <Experience />
      </HomeSection>

      <HomeSection id="testimonials" estimatedHeight="36rem">
        <SocialProof
          testimonials={testimonials}
          proofItems={softSkills.items}
          metrics={softSkills.metrics ?? []}
        />
      </HomeSection>

      <HomeSection id="services" estimatedHeight="32rem">
        <Services />
      </HomeSection>

      <HomeSection id="skills" estimatedHeight="32rem">
        <Skills locale={locale} />
      </HomeSection>

      <HomeSection id="soft-skills" estimatedHeight="28rem">
        <SoftSkills />
      </HomeSection>

      <HomeSection id="contact" estimatedHeight="28rem">
        <Contact />
      </HomeSection>
    </NextIntlClientProvider>
  );
}
