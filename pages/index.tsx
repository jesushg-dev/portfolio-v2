import React, { FC } from 'react';
import Head from 'next/head';
import type { NextPageContext } from 'next/types';

import Hero from '../components/Home/Hero';
import About from '../components/Home/About';
import Skills from '../components/Home/Skills';
import Layout from '../components/Layout/Index';

import { getValues } from '../utils/db';
import { ISkill } from '../utils/interfaces/portfolio';

interface IHomeProps {
  skills: ISkill[];
}

const Home: FC<IHomeProps> = ({ skills }) => {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-100">
      <Head>
        <title>Portfolio - JHG</title>
      </Head>
      <Layout>
        <Hero />
        <About />
        <div className="bg-white">
          <Skills skills={skills} />
        </div>
      </Layout>
    </div>
  );
};

const getStaticProps = async (context: NextPageContext) => {
  const locale = context.locale;

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
      skills: [...frontend, ...backend, ...devops],
      messages: {
        ...common.default,
        ...index.default,
      },
    },
  };
};

export { getStaticProps };
export default Home;
