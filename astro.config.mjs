import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { site } from './src/lib/site.ts';
export default defineConfig({
  site: site.url,
  output: 'static',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-dark', langs: ['verilog', 'system-verilog'] },
  },
});
