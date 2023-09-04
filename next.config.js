/** @type {import('next').NextConfig} */

module.exports = {
  experimental: { appDir: true },
  images: {
    domains: ['cdn.simpleicons.org', 'res.cloudinary.com', 'i.scdn.co'],
  },
  redirects: async () => {
    return [
      {
        source: '/certificates',
        destination: '/certificates/all',
        permanent: true,
      },
    ];
  },
};
