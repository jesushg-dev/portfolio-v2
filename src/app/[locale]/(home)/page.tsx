import About from "@/features/home/components/about";
import Contact from "@/features/home/components/contact";
import Hero from "@/features/home/components/hero";
import Portfolio from "@/features/home/components/portfolio";
import Skills from "@/features/home/components/skills";
import SoftSkills from "@/features/home/components/soft-skills";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <SoftSkills />
      <Portfolio />
      <Contact />
    </>
  );
}
