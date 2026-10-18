import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
export default defineConfig({
  site: 'https://kazenoko.me',
  output: 'static',
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-dark', langs: ['verilog', 'system-verilog'] },
  },
});
