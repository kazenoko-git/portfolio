import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
export async function GET(context: APIContext) {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return rss({
    title: 'kazenoko — Field notes',
    description: 'Notes on silicon, software, and systems.',
    site: context.site!,
    items: posts
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.summary,
        pubDate: post.data.date,
        link: `/writing/${post.id}/`,
      })),
  });
}
