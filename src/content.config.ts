import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { repositoryContent } from './lib/repository-loader';
const source = z.object({
  repo: z.string(),
  path: z.string(),
  revision: z.string(),
  url: z.url(),
  updatedAt: z.coerce.date(),
});
const common = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(),
  dateLabel: z.string().default('Published'),
  source: source.optional(),
  repositoryDocumentation: source.extend({ html: z.string() }).optional(),
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
  loader: repositoryContent('writing'),
  schema: common.extend({
    draft: z.boolean().default(true),
    updatedAt: z.coerce.date().optional(),
    series: z.string().optional(),
  }),
});
const projects = defineCollection({
  loader: repositoryContent('projects'),
  schema: common.extend({
    technologies: z.array(z.string()).default([]),
    category: z.string(),
    repoUrl: z.url().optional(),
  }),
});
const papers = defineCollection({
  loader: repositoryContent('papers'),
  schema: common.extend({
    authors: z.array(z.string()),
    abstract: z.string(),
    publicationStatus: z.string(),
    pdfUrl: z.url().optional(),
  }),
});
const certifications = defineCollection({
  loader: repositoryContent('certifications'),
  schema: common.extend({
    issuer: z.string(),
    credentialUrl: z.url().optional(),
  }),
});
export const collections = { writing, projects, papers, certifications };
