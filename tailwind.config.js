/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: {
        'hero-main':
          "url('https://res.cloudinary.com/js-media/image/upload/f_auto/q_auto/v1642524508/portfolio/hero/3233453_brzqcm.webp')",
        'profile-photo':
          "url('https://res.cloudinary.com/js-media/image/upload/v1670269379/portfolio/carnet/jesus-hernandez.webp')",
      },
      keyframes: {
        scroll: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0, transform: 'translateY(0.5rem)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
