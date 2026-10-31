import { getPublicLocale } from "@/lib/public-site/locale";
import { api } from "@/trpc/server";
import Hero from "@/features/home/components/hero";
import About from "@/features/home/components/about";
import Services from "@/features/home/components/services";
import SoftSkills from "@/features/home/components/soft-skills";
import SocialProof from "@/features/home/components/social-proof";
import Skills from "@/features/home/components/skills";
import Experience from "@/features/home/components/experience";
import Portfolio from "@/features/home/components/portfolio";
import Contact from "@/features/home/components/contact";
import HomeSection from "@/features/home/components/home-section";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickPublicRouteMessages } from "@/lib/public-site/messages";

export { generateMetadata } from "./metadata";

export default async function Home() {
  const locale = await getPublicLocale();
  const [stats, testimonials, messages] = await Promise.all([
    api.portfolio.getStatsPublic({ locale }),
    api.portfolio.getTestimonialsPublic({ locale, limit: 3 }),
    getMessages({ locale }),
  ]);

  return (
    <NextIntlClientProvider
      messages={pickPublicRouteMessages(messages, "home")}
    >
      <Hero stats={stats} />
      <HomeSection id="about" estimatedHeight="36rem">
        <About />
      </HomeSection>
      <HomeSection id="services">
        <Services />
      </HomeSection>
      <HomeSection id="soft-skills" estimatedHeight="28rem">
        <SoftSkills />
      </HomeSection>
      <HomeSection>
        <SocialProof stats={stats} testimonials={testimonials} />
      </HomeSection>
      <HomeSection id="skills">
        <Skills locale={locale} />
      </HomeSection>
      <HomeSection id="experience" estimatedHeight="28rem">
        <Experience />
      </HomeSection>
      <HomeSection estimatedHeight="36rem">
        <Portfolio />
      </HomeSection>
      <HomeSection id="contact" estimatedHeight="28rem">
        <Contact />
      </HomeSection>
    </NextIntlClientProvider>
  );
}
