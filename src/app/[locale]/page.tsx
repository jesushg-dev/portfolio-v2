'use client';

import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';

const Hero = dynamic(() => import('@/components/Home/Hero'));
const About = dynamic(() => import('@/components/Home/About'));
const Skills = dynamic(() => import('@/components/Home/Skills'));
const Contact = dynamic(() => import('@/components/Home/Contact'));
const Portfolio = dynamic(() => import('@/components/Home/Portfolio'));
const SoftSkills = dynamic(() => import('@/components/Home/SoftSkills'));

export default function IndexPage() {
  return (
    <Layout>
      <Hero />
      <About />
      <Skills />
      <SoftSkills />
      <Portfolio />
      <Contact />
    </Layout>
  );
}
