import tailwindcss from '@tailwindcss/postcss';
import postcssLightningcss from 'postcss-lightningcss';

export default {
  plugins: [
    tailwindcss(),
    postcssLightningcss({
      browsers: '> 0.5%, last 2 versions, not dead, Android >= 5, iOS >= 10',
      lightningcssOptions: {
        drafts: {
          customMedia: true,
        },
      },
    }),
  ],
};
