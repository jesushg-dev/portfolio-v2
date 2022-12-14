import React, { FC } from 'react';
import Head from 'next/head';
import type { NextPageContext } from 'next/types';

import Hero from '../components/Home/Hero';
import About from '../components/Home/About';
import Skills from '../components/Home/Skills';
import Contact from '../components/Home/Contact';
import Portfolio from '../components/Home/Portfolio';
import SoftSkills from '../components/Home/SoftSkills';
import Layout from '../components/Layout/Index';

import { getValues } from '../utils/db';
import { IProject, ISkill } from '../utils/interfaces/portfolio';

interface IHomeProps {
  skills: ISkill[];
  portfolio: IProject[];
}

const Home: FC<IHomeProps> = ({ skills, portfolio }) => {
  return (
    <div className="flex min-h-screen flex-col justify-between scroll-smooth bg-slate-100">
      <Head>
        <title>Portfolio - JHG</title>
      </Head>
      <Layout>
        <Hero />
        <About />
        <div className="bg-white">
          <Skills skills={skills} />
        </div>
        <SoftSkills />
        <Portfolio portfolio={portfolio} />
        <Contact />
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

  // Get Portfolio
  const portfolio = await getValues<IProject[]>(`${locale}/portfolio`);

  // Get translations
  const indexAsync = import(`../translations/${locale}/index.json`);
  const commonAsync = import(`../translations/${locale}/common.json`);
  const [common, index] = await Promise.all([commonAsync, indexAsync]);

  return {
    props: {
      portfolio,
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
