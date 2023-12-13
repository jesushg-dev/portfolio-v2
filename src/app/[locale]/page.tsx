import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';

import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { locales } from '../../config';

const Hero = dynamic(() => import('@/components/Home/Hero'));
const About = dynamic(() => import('@/components/Home/About'));
const Skills = dynamic(() => import('@/components/Home/Skills'));
const Contact = dynamic(() => import('@/components/Home/Contact'));
const Portfolio = dynamic(() => import('@/components/Home/Portfolio'));
const SoftSkills = dynamic(() => import('@/components/Home/SoftSkills'));

type Props = {
  params: {locale: string};
};

export default function IndexPage({params: {locale}}: Props) {
  // Validate that the incoming `locale` parameter is valid
  const isValidLocale = locales.some((cur) => cur === locale);
  if (!isValidLocale) notFound();

  // Enable static rendering
  unstable_setRequestLocale(locale);

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