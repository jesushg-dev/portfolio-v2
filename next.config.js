// @ts-check

const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const config = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'cdn.simpleicons.org',
        },
        {
          protocol: 'https',
          hostname: 'res.cloudinary.com',
        },
        {
          protocol: 'https',
          hostname: 'i.scdn.co',
        }
      ],
    },
    redirects: async () => {
      return [
        {
          source: '/certificates',
          destination: '/certificates/all',
          permanent: true,
        },
      ];
    }
};

module.exports = withNextIntl(config);
