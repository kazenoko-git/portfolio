import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
export async function GET({ site }: APIContext) {
  const entries = (
    await Promise.all([
      getCollection('writing', ({ data }) => !data.draft),
      getCollection('projects'),
      getCollection('papers'),
      getCollection('certifications'),
    ])
  ).flat();
  const paths = [
    '/',
    '/writing/',
    '/projects/',
    '/papers/',
    '/certifications/',
    '/contact/',
    ...entries.map((e) => `/${e.collection}/${e.id}/`),
  ];
  const escape = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escape(new URL(path, site).href)}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
