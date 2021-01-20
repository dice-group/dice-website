// See https://tailwindcss.com/docs/configuration for details

module.exports = {
  purge: [
    `./src/components/styles/main.css`,
    './src/**/!(*.d).{ts,js,jsx,tsx}',
    '../data/**/*.ttl',
    '../pages/**/*.{md,mdx}',
  ],
  darkMode: false,
  theme: {
    extend: {
      maxWidth: {
        '1/5': '20%',
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
      },
    },
  },
  variants: {},
  plugins: [],
};
