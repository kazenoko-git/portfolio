import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const origin = 'https://kazenoko.pages.dev';
const page = (path) => readFile(`dist/${path}/index.html`, 'utf8');

test('plain Markdown produces linked project and award pages, including the certificates alias', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const path of [
    'projects/prodo',
    'projects/klima',
    'certifications/ascendant-2026',
    'certifications/apotheosis-2026',
  ]) {
    const html = await page(path);
    assert.match(html, /<article class="prose"/);
    assert.ok(sitemap.includes(`${origin}/${path}/`));
    const collection = path.split('/')[0];
    assert.ok((await page(collection)).includes(`href="/${path}/"`));
  }
  assert.ok(
    (await page('projects/prodo')).includes('/certifications/ascendant-2026/'),
  );
  assert.ok(
    (await page('certifications/ascendant-2026')).includes('/projects/prodo/'),
  );
});

test('canonical URLs, sitemap discovery, and structured data describe the production site', async () => {
  const html = await page('projects/prodo');
  assert.ok(html.includes(`rel="canonical" href="${origin}/projects/prodo/"`));
  assert.ok(html.includes('href="https://github.com/fourtysevencode/prodo"'));
  assert.ok(html.includes('href="https://github.com/kazenoko-git/portfolio"'));
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  assert.ok(match, 'JSON-LD is rendered in static HTML');
  const data = JSON.parse(match[1]);
  assert.equal(data['@context'], 'https://schema.org');
  assert.ok(
    data['@graph'].some(
      (item) => item['@type'] === 'Person' && item.name === 'Ivan Samuel',
    ),
  );
  assert.ok(
    data['@graph'].some(
      (item) =>
        item.subjectOf?.codeRepository ===
        'https://github.com/fourtysevencode/prodo',
    ),
  );
  assert.ok(
    (await readFile('dist/robots.txt', 'utf8')).includes(
      `Sitemap: ${origin}/sitemap.xml`,
    ),
  );
  assert.ok(
    !(await readFile('dist/sitemap.xml', 'utf8')).includes('kazenoko.me'),
  );
});

test('draft articles do not emit publishable article structured data', async () => {
  const html = await page('writing/neuromorphic-npu');
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );
  const data = JSON.parse(match[1]);
  assert.ok(!data['@graph'].some((item) => item['@type'] === 'BlogPosting'));
});
