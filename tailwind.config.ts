import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBF4',
        sand: '#D4CCC4',
        'warm-gray': '#A89E94',
        'brown-mid': '#7D6F63',
        'brown-dark': '#514033',
        'peach-light': '#FFE2D6',
        peach: '#FCBD9D',
        espresso: '#413429',
      },
    },
  },
  plugins: [],
};

export default config;
