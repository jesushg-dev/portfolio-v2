import About from "@/components/Home/About";
import Contact from "@/components/Home/Contact";
import Hero from "@/components/Home/hero";
import Portfolio from "@/components/Home/Portfolio";
import Skills from "@/components/Home/Skills";
import SoftSkills from "@/components/Home/SoftSkills";

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
