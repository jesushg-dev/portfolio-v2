import React, { Suspense, lazy } from 'react';

import Head from 'next/head';
import { createProxySSGHelpers } from '@trpc/react-query/ssg';

import Hero from '../components/Home/Hero';
import Layout from '../components/Layout/Index';
import Loading from '../components/Common/Loading';

import transformer from 'superjson';
import { getValues } from '../utils/db';
import { createContext } from '../server/context';
import { appRouter } from '../server/routers/_app';

import { localeType } from '../utils/types';
import { LIMIT_PER_PAGE } from '../utils/constants';

import type { NextPageContext, NextPage } from 'next/types';
import type { ISkill } from '../utils/interfaces/portfolio';

const About = lazy(() => import('../components/Home/About'));
const Skills = lazy(() => import('../components/Home/Skills'));
const Contact = lazy(() => import('../components/Home/Contact'));
const Portfolio = lazy(() => import('../components/Home/Portfolio'));
const SoftSkills = lazy(() => import('../components/Home/SoftSkills'));

interface IHomeProps {
  skills: {
    devops: ISkill[];
    backend: ISkill[];
    frontend: ISkill[];
  };
}

const Home: NextPage<IHomeProps> = ({ skills }: IHomeProps) => {
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
          <Portfolio />
          <Contact />
        </Suspense>
      </Layout>
    </div>
  );
};

const getStaticProps = async (context: NextPageContext) => {
  const locale = (context.locale || context.defaultLocale || 'en') as localeType;

  const ctx = await createContext();
  const ssg = createProxySSGHelpers({ router: appRouter, ctx, transformer });

  // prefetch `getProjects` query
  await ssg.getProjects.prefetchInfinite({ limit: LIMIT_PER_PAGE, locale });

  // Get skills
  const devopsAsync = getValues<ISkill[]>(`${locale}/skills/devops`);
  const backendAsync = getValues<ISkill[]>(`${locale}/skills/backend`);
  const frontendAsync = getValues<ISkill[]>(`${locale}/skills/frontend`);
  const [devops, backend, frontend] = await Promise.all([devopsAsync, backendAsync, frontendAsync]);

  // Get translations
  const indexAsync = import(`../translations/${locale}/index.json`);
  const commonAsync = import(`../translations/${locale}/common.json`);
  const [common, index] = await Promise.all([commonAsync, indexAsync]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      skills: { devops, backend, frontend },
      messages: { ...common.default, ...index.default },
    },
    revalidate: 60 * 60 * 24,
  };
};

export { getStaticProps };
export default Home;
