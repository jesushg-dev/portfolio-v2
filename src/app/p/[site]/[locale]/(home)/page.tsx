import { getPublicLocale } from "@/lib/public-site/locale";
import { api } from "@/trpc/server";
import Hero from "@/features/home/components/hero";
import { HomeTechMarquee } from "@/features/home/components/home-tech-marquee";
import Portfolio from "@/features/home/components/portfolio";
import Experience from "@/features/home/components/experience";
import Services from "@/features/home/components/services";
import About from "@/features/home/components/about";
import Skills from "@/features/home/components/skills";
import SocialProof from "@/features/home/components/social-proof";
import HomeFaq from "@/features/home/components/faq";
import Contact from "@/features/home/components/contact";
import HomeSection from "@/features/home/components/home-section";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickPublicRouteMessages } from "@/lib/public-site/messages";

export { generateMetadata } from "./metadata";

export default async function Home() {
  const locale = await getPublicLocale();
  const [stats, testimonials, messages, skills] = await Promise.all([
    api.portfolio.getStatsPublic({ locale }),
    api.portfolio.getTestimonialsPublic({ locale, limit: 3 }),
    getMessages({ locale }),
    api.portfolio.getSkills({ locale }),
  ]);

  return (
    <NextIntlClientProvider
      messages={pickPublicRouteMessages(messages, "home")}
    >
      <Hero stats={stats} />
      <HomeTechMarquee items={skills} />

      <HomeSection id="portfolio" estimatedHeight="36rem">
        <Portfolio />
      </HomeSection>

      <HomeSection id="experience" estimatedHeight="36rem">
        <Experience />
      </HomeSection>

      <HomeSection id="services" estimatedHeight="32rem">
        <Services />
      </HomeSection>

      <HomeSection id="about" estimatedHeight="32rem">
        <About />
      </HomeSection>

      <HomeSection id="skills" estimatedHeight="32rem">
        <Skills locale={locale} />
      </HomeSection>

      <HomeSection estimatedHeight="28rem">
        <SocialProof stats={stats} testimonials={testimonials} />
      </HomeSection>

      <HomeSection estimatedHeight="24rem">
        <HomeFaq />
      </HomeSection>

      <HomeSection id="contact" estimatedHeight="28rem">
        <Contact />
      </HomeSection>
    </NextIntlClientProvider>
  );
}
