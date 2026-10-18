import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
const root = resolve('dist');
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : join(dir, e.name),
      ),
    )
  ).flat();
}
test('all generated local links resolve, including heading anchors', async () => {
  for (const file of (await files(root)).filter((f) => f.endsWith('.html'))) {
    const html = await readFile(file, 'utf8');
    for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|data:|\/\/)/.test(raw)) continue;
      const [path, hash] = raw.split('#');
      let target = path
        ? path.startsWith('/')
          ? join(root, path)
          : resolve(dirname(file), path)
        : file;
      try {
        if ((await stat(target)).isDirectory())
          target = join(target, 'index.html');
      } catch {
        assert.fail(`Broken link ${raw} in ${file}`);
      }
      const contents = await readFile(target, 'utf8');
      if (hash && target.endsWith('.html'))
        assert.ok(
          contents.includes(`id="${hash}"`),
          `Missing anchor ${raw} in ${file}`,
        );
    }
  }
});
test('editorial draft is marked noindex and excluded from syndication', async () => {
  const draft = await readFile(
    join(root, 'writing/neuromorphic-npu/index.html'),
    'utf8',
  );
  assert.match(draft, /name="robots" content="noindex, nofollow"/);
  assert.match(draft, /Unpublished draft outline/);
  for (const file of ['rss.xml', 'sitemap.xml'])
    assert.ok(
      !(await readFile(join(root, file), 'utf8')).includes(
        '/writing/neuromorphic-npu',
      ),
    );
});

test('homepage has one profile and a navigation containing only section links', async () => {
  const html = await readFile(join(root, 'index.html'), 'utf8');
  const header = html.match(
    /<header class="site-header">([\s\S]*?)<\/header>/,
  )[1];
  assert.ok(
    !header.includes('wordmark') &&
      !header.includes('INDEX / 001') &&
      !header.includes('風の子'),
  );
  assert.equal((html.match(/id="profile"/g) || []).length, 1);
  assert.equal((html.match(/data-portrait-grid/g) || []).length, 1);
  assert.ok(!html.includes('data-person'));
  assert.match(
    html,
    /<svg[^>]*data-portrait-grid[^>]*aria-label="Line portrait of Ivan Samuel"/,
  );
  assert.ok(!html.includes('ASCII portrait'));
  for (const label of [
    '01 / THE CITY',
    'MOTION PAUSED',
    'Silicon. Software. Systems.',
  ])
    assert.ok(!html.includes(label));
});

test('collection pages have plain titles, search, tags, and recent previews', async () => {
  for (const [collection, title] of [
    ['writing', 'Blogs'],
    ['projects', 'Projects'],
    ['papers', 'Papers'],
    ['certifications', 'Certifications'],
  ]) {
    const html = await readFile(join(root, collection, 'index.html'), 'utf8');
    assert.ok(html.includes(`<h1>${title}</h1>`));
    assert.ok(html.includes('data-entry-search'));
    assert.ok(html.includes('aria-label="Filter by tag"'));
    assert.ok(html.includes(`Recent ${title.toLowerCase()}`));
    assert.ok(!html.includes('intro-subtitle'));
  }
  const home = await readFile(join(root, 'index.html'), 'utf8');
  assert.ok(home.includes('href="/#profile"'));
  const about = await readFile(join(root, 'about/index.html'), 'utf8');
  assert.ok(about.includes('/#profile'));
  assert.ok(!about.includes('Underneath'));
  const contact = await readFile(join(root, 'contact/index.html'), 'utf8');
  assert.ok(contact.includes('<h1>Contact</h1>'));
  assert.ok(!contact.includes('06 / CONTACT'));
});
