import Head from 'next/head';

import type { NextPageContext } from 'next/types';
import Hero from '../components/Home/Hero';

import Layout from '../components/Layout/Index';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Head>
        <title>Portfolio - JHG</title>
      </Head>
      <Layout>
        <Hero />
        <div className="container mx-auto px-4"></div>
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
