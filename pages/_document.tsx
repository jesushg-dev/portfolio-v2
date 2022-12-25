import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

const MyDocument = () => {
  return (
    <Html>
      <Head>
        <meta name="theme-color" content="#05f" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#05f" />

        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png"></link>

        <meta
          name="keywords"
          content="portfolio, portafolio, jesus, hernadez, jesús hernández., desarrollador, programador, ingeniero, informatica, paginas web, android"
        />
        <meta
          name="description"
          content="Hi, I'm Jesús Hernández, a Full-Stack Web Developer in React.js | Next.js | React Native | HTML 5 | CSS3 | Typescript | Responsive Design | C# | Asp.net Core | Git | Azure | SCRUM | Agile Methodology"
        />

        <meta property="og:title" content="Portfolio - Jesús Hernández " />
        <meta property="og:url" content="https://portfolio-jhg.vercel.app" />
        <meta
          property="og:image"
          content="https://res.cloudinary.com/js-media/image/upload/v1640647057/portfolio/portf-1_bkhwxr.png"
        />
        <meta
          property="og:description"
          content="Hi, I'm Jesús Hernández, a Full-Stack Web Developer in React.js | Next.js | React Native | HTML 5 | CSS3 | Typescript | Responsive Design | C# | Asp.net Core | Git | Azure | SCRUM | Agile Methodology"
        />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary" />
        <meta property="twitter:title" content="Portfolio - Jesús Hernández " />
        <meta
          name="twitter:image"
          content="https://res.cloudinary.com/js-media/image/upload/v1640647057/portfolio/portf-1_bkhwxr.png"
        />
        <meta
          property="twitter:description"
          content="Hi, I'm Jesús Hernández, a Full-Stack Web Developer in React.js | Next.js | React Native | HTML 5 | CSS3 | Typescript | Responsive Design | C# | Asp.net Core | Git | Azure | SCRUM | Agile Methodology"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default MyDocument;
