import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { repositoryCover } from '../src/lib/repository-import.mjs';

test('project pages display the confirmed approximate timeline instead of the page publication date', async () => {
  for (const [slug, period] of [
    ['prodo', 'Around May–June 2026'],
    ['klima', 'Around June–July 2026'],
  ]) {
    const html = await readFile(`dist/projects/${slug}/index.html`, 'utf8');
    const header = html.match(
      /<header class="wrap article-header">([\s\S]*?)<\/header>/,
    )[1];
    assert.ok(header.includes(period));
    assert.ok(!header.includes('18 Oct 2026'));
    assert.ok(html.includes('project-image-hero'));
    assert.ok(
      html.includes(
        `src="/images/projects/${slug === 'prodo' ? 'focus' : 'climate'}.svg"`,
      ),
    );
  }
  const listing = await readFile('dist/projects/index.html', 'utf8');
  assert.ok(listing.includes('Around May–June 2026'));
  assert.ok(listing.includes('Around June–July 2026'));
});

test('actual certificate images and project illustrations reach the site and the city billboards', async () => {
  for (const slug of ['ascendant-2026', 'apotheosis-2026']) {
    const html = await readFile(
      `dist/certifications/${slug}/index.html`,
      'utf8',
    );
    assert.ok(html.includes(`/images/certificates/${slug}.webp`));
    assert.ok(html.includes('The actual certificate'));
  }
  const home = await readFile('dist/index.html', 'utf8');
  assert.ok(home.includes('/images/projects/focus.svg'));
  assert.ok(home.includes('/images/projects/climate.svg'));
  assert.ok(!home.includes('COVER ART PENDING'));
});

test('cover discovery selects source charts over badges and resolves relative paths', () => {
  const body =
    '![License](https://img.shields.io/badge/license-MIT-green.svg)\n![Results](../figures/results.png)';
  const cover = repositoryCover(body, {
    repo: 'ivan/model',
    revision: 'main',
    path: 'research/paper.md',
  });
  assert.equal(
    cover.cover,
    'https://raw.githubusercontent.com/ivan/model/main/figures/results.png',
  );
  assert.equal(cover.coverAlt, 'Results');
});
