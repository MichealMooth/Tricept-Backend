import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary_dark: '#000039',
        primary_blue: '#001777',
        light_grey: '#e3e4e2',
        off_white: '#f5f5f3',
        accent_cyan: '#17f0f0',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #000039 0%, #001777 50%, #17f0f0 100%)',
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
  plugins: [animate],
};

export default config;
