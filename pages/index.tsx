import React, { Suspense, lazy } from 'react';

import Head from 'next/head';
import { createProxySSGHelpers } from '@trpc/react-query/ssg';

import Hero from '../components/Home/Hero';
import Layout from '../components/Layout/Index';
import Loading from '../components/Common/Loading';

import transformer from 'superjson';
import { createContext } from '../server/context';
import { appRouter } from '../server/routers/_app';

import { localeType } from '../utils/interfaces/types';
import { LIMIT_PER_PAGE, LIMIT_PER_PAGE_BIG, REVALIDATE_TIME } from '../utils/constants';

import type { NextPageContext, NextPage } from 'next/types';

const About = lazy(() => import('../components/Home/About'));
const Skills = lazy(() => import('../components/Home/Skills'));
const Contact = lazy(() => import('../components/Home/Contact'));
const Portfolio = lazy(() => import('../components/Home/Portfolio'));
const SoftSkills = lazy(() => import('../components/Home/SoftSkills'));

interface IHomeProps {
  locale: localeType;
}

const Home: NextPage<IHomeProps> = ({ locale }: IHomeProps) => {
  return (
    <div className="flex min-h-screen flex-col justify-between scroll-smooth bg-background-200">
      <Head>
        <title>Jesús Hernández | Desarrollador Web Front-End</title>
      </Head>
      <Layout>
        <Hero />
        <Suspense fallback={<Loading />}>
          <About />
          <Skills {...{ locale }} />
          <SoftSkills />
          <Portfolio {...{ locale }} />
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

  // prefetch `getSkills` query
  await ssg.getSkills.prefetch({ limit: LIMIT_PER_PAGE_BIG, locale, type: 'FRONTEND' });
  await ssg.getSkills.prefetch({ limit: LIMIT_PER_PAGE_BIG, locale, type: 'BACKEND' });
  await ssg.getSkills.prefetch({ limit: LIMIT_PER_PAGE_BIG, locale, type: 'MOBILE' });
  await ssg.getSkills.prefetch({ limit: LIMIT_PER_PAGE_BIG, locale, type: 'TOOLS' });

  // Get translations
  const indexAsync = import(`../translations/${locale}/index.json`);
  const commonAsync = import(`../translations/${locale}/common.json`);
  const [common, index] = await Promise.all([commonAsync, indexAsync]);

  return {
    props: {
      locale,
      trpcState: ssg.dehydrate(),
      messages: { ...common.default, ...index.default },
    },
    revalidate: REVALIDATE_TIME,
  };
};

export { getStaticProps };
export default Home;
