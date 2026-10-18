import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const common = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(),
  tags: z.array(z.string()).default([]),
  status: z.string().default('In progress'),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  city: z.boolean().default(true),
  featuredOrder: z.number().default(100),
  cover: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
});
const writing = defineCollection({
  loader: glob({
    pattern: ['writing/**/*.{md,mdx}', 'blogs/**/*.{md,mdx}'],
    base: './src/content',
    generateId: ({ entry }) =>
      entry.replace(/^(writing|blogs)\//, '').replace(/\.(md|mdx)$/, ''),
  }),
  schema: common.extend({
    draft: z.boolean().default(true),
    updatedAt: z.coerce.date().optional(),
    series: z.string().optional(),
  }),
});
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: common.extend({
    technologies: z.array(z.string()).default([]),
    category: z.string(),
    repoUrl: z.url().optional(),
  }),
});
const papers = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/papers' }),
  schema: common.extend({
    authors: z.array(z.string()),
    abstract: z.string(),
    publicationStatus: z.string(),
    pdfUrl: z.url().optional(),
  }),
});
const certifications = defineCollection({
  loader: glob({
    pattern: ['certifications/**/*.{md,mdx}', 'certificates/**/*.{md,mdx}'],
    base: './src/content',
    generateId: ({ entry }) =>
      entry
        .replace(/^(certifications|certificates)\//, '')
        .replace(/\.(md|mdx)$/, ''),
  }),
  schema: common.extend({
    issuer: z.string(),
    credentialUrl: z.url().optional(),
  }),
});
export const collections = { writing, projects, papers, certifications };
