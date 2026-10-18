import process from 'node:process';
import { glob, type Loader, type LoaderContext } from 'astro/loaders';
import config from '../../config/repositories.json';
import {
  importRepositories,
  sanitizeRepositoryHtml,
} from './repository-import.mjs';

let remote: ReturnType<typeof importRepositories>;
const aliases: Record<string, string[]> = {
  projects: ['projects'],
  papers: ['papers'],
  writing: ['writing', 'blogs'],
  certifications: ['certifications', 'certificates'],
};

export function repositoryContent(collection: string): Loader {
  const local = glob({
    base: './content',
    pattern: aliases[collection].map((folder) => `${folder}/**/*.{md,mdx}`),
    generateId: ({ entry }) =>
      entry.replace(/^[^/]+\//, '').replace(/\.(md|mdx)$/, ''),
  });
  return {
    name: `repository-content-${collection}`,
    async load(context: LoaderContext) {
      remote ??= importRepositories(config, {
        token: process.env.GITHUB_TOKEN,
        log: (message: string) => context.logger.info(message),
      });
      const entries = await remote;
      const routes = new Map(
        entries.map((entry) => [
          `${entry.data.source.repo.toLowerCase()}:${entry.data.source.path}`,
          `/${entry.collection}/${entry.id}/`,
        ]),
      );
      const imported = new Map();
      for (const entry of entries.filter(
        (item) => item.collection === collection,
      )) {
        const rendered = await context.renderMarkdown(entry.body);
        rendered.html = sanitizeRepositoryHtml(
          rendered.html,
          entry.data.source,
          routes,
        );
        imported.set(entry.id, { ...entry, rendered });
      }
      // Reparse local entries so an old imported appendix cannot survive source
      // removal or a repository becoming private in Astro's persistent cache.
      context.store.clear();
      await local.load(context);
      const locals = [...context.store.values()];
      for (const entry of imported.values()) {
        const curated = locals.find(
          (item) =>
            item.id === entry.id ||
            (item.data.repoUrl && item.data.repoUrl === entry.data.repoUrl),
        );
        if (curated) {
          const data = await context.parseData({
            id: curated.id,
            data: {
              ...curated.data,
              repositoryDocumentation: {
                html: entry.rendered.html,
                ...entry.data.source,
              },
            },
            filePath: curated.filePath,
          });
          context.store.set({
            ...curated,
            data,
            digest: context.generateDigest({
              local: curated.digest,
              repository: entry,
            }),
          });
        } else {
          const data = await context.parseData({
            id: entry.id,
            data: entry.data,
          });
          context.store.set({
            id: entry.id,
            data,
            body: entry.body,
            rendered: entry.rendered,
            digest: context.generateDigest(entry),
          });
        }
      }
    },
  };
}
