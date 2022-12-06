import React from 'react';

import Head from 'next/head';

import type { NextPageContext } from 'next/types';

import Hero from '../components/Home/Hero';
import About from '../components/Home/About';
import Skills from '../components/Home/Skills';

import Layout from '../components/Layout/Index';

const Home = () => {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-100">
      <Head>
        <title>Portfolio - JHG</title>
      </Head>
      <Layout>
        <Hero />
        <About />
        <div className="bg-white">
          <Skills />
        </div>
      </Layout>
    </div>
  );
};

const getStaticProps = async (context: NextPageContext) => {
  const locale = context.locale;
  const common = await import(`../translations/${locale}/common.json`);
  const index = await import(`../translations/${locale}/index.json`);
  return {
    props: {
      messages: {
        ...common.default,
        ...index.default,
      },
    },
  };
};

export { getStaticProps };
export default Home;
