// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  
  integrations: [react()],

  vite: {
    server: {
      allowedHosts: ['meridian-press.com', 'atlasclassicalpress.com'],
    },
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['better-react-mathjax'],
    },
    ssr: {
      noExternal: ['better-react-mathjax'],
    },
  }
});
