/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'hero-main':
          "url('https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3233453_brzqcm.webp')",
        'hero-skills':
          "url('https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/1947484_ehwya0.webp')",
        'hero-contact':
          "url('https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3239480_nnfqfm.webp')",
        'profile-photo':
          "url('https://res.cloudinary.com/js-media/image/upload/v1670269379/portfolio/carnet/jesus-hernandez.webp')",
      },
      keyframes: {
        scroll: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0, transform: 'translateY(0.5rem)' },
        },
      },
      boxShadow: {
        icon: '0px 10px 10px rgba(0,0,0,0.1)',
      },
      colors: {
        email: '#EA4335',
        phone: '#004ecb',
        github: '#333333',
        linkedin: '#0a66c2',
        whatsapp: '#128c7e',
      },
      gridTemplateColumns: {
        skills: 'repeat(auto-fit, minmax(4.75rem, 1fr))',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
  safelist: [
    {
      pattern: /(bg|border)-(email|phone|github|linkedin|whatsapp)/,
      variants: ['hover', 'before'],
    },
  ],
};
