import React, { FC, Suspense, lazy } from 'react';
import Head from 'next/head';
import type { NextPageContext, NextPage } from 'next/types';

import Hero from '../components/Home/Hero';
import Layout from '../components/Layout/Index';

import { getValues } from '../utils/db';
import type { IProject, ISkill } from '../utils/interfaces/portfolio';

const About = lazy(() => import('../components/Home/About'));
const Skills = lazy(() => import('../components/Home/Skills'));
const Contact = lazy(() => import('../components/Home/Contact'));
const Portfolio = lazy(() => import('../components/Home/Portfolio'));
const SoftSkills = lazy(() => import('../components/Home/SoftSkills'));

interface IHomeProps {
  portfolio: IProject[];
  skills: {
    devops: ISkill[];
    backend: ISkill[];
    frontend: ISkill[];
  };
}

const Loading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
    </div>
  );
};

const Home: NextPage<IHomeProps> = ({ skills, portfolio }: IHomeProps) => {
  return (
    <div className="flex min-h-screen flex-col justify-between scroll-smooth bg-slate-100">
      <Head>
        <title>Jesús Hernández | Desarrollador Web Front-End</title>
      </Head>
      <Layout>
        <Hero />
        <Suspense fallback={<Loading />}>
          <About />
          <Skills {...skills} others={[]} />
          <SoftSkills />
          <Portfolio portfolio={portfolio} />
          <Contact />
        </Suspense>
      </Layout>
    </div>
  );
};

const getStaticProps = async (context: NextPageContext) => {
  const locale = context.locale || context.defaultLocale || 'en';

  // Get skills
  const devopsAsync = getValues<ISkill[]>(`${locale}/skills/devops`);
  const backendAsync = getValues<ISkill[]>(`${locale}/skills/backend`);
  const frontendAsync = getValues<ISkill[]>(`${locale}/skills/frontend`);
  const [devops, backend, frontend] = await Promise.all([devopsAsync, backendAsync, frontendAsync]);

  // Get Portfolio
  const portfolio = await getValues<IProject[]>(`${locale}/portfolio`);

  // Get translations
  const indexAsync = import(`../translations/${locale}/index.json`);
  const commonAsync = import(`../translations/${locale}/common.json`);
  const [common, index] = await Promise.all([commonAsync, indexAsync]);

  return {
    props: {
      portfolio,
      skills: { devops, backend, frontend },
      messages: { ...common.default, ...index.default },
    },
  };
};

export { getStaticProps };
export default Home;
