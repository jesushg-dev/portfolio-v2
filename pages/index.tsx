import Head from 'next/head';

import type { NextPageContext } from 'next/types';
import About from '../components/Home/About';
import Hero from '../components/Home/Hero';

import Layout from '../components/Layout/Index';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-100">
      <Head>
        <title>Portfolio - JHG</title>
      </Head>
      <Layout>
        <Hero />
        <About />
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
