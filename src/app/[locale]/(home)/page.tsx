import About from "@/features/home/components/about";
import Contact from "@/features/home/components/contact";
import Experience from "@/features/home/components/experience";
import Hero from "@/features/home/components/hero";
import Portfolio from "@/features/home/components/portfolio";
import Skills from "@/features/home/components/skills";
import SoftSkills from "@/features/home/components/soft-skills";
import SocialProof from "@/features/home/components/social-proof";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Experience />
      <Skills />
      <SoftSkills />
      <Portfolio />
      <SocialProof />
      <Contact />
    </>
  );
}
