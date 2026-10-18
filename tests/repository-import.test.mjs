import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldImport,
  classifyDocument,
  splitMarkdown,
  makeEntry,
  importRepositories,
  sanitizeRepositoryHtml,
} from '../src/lib/repository-import.mjs';

const repo = {
  name: 'Example',
  full_name: 'ivan/Example',
  private: false,
  fork: false,
  owner: { login: 'ivan' },
  default_branch: 'main',
  html_url: 'https://github.com/ivan/Example',
  description: 'A real source description.',
  created_at: '2025-06-01T00:00:00Z',
  pushed_at: '2026-10-18T00:00:00Z',
  language: 'Python',
  topics: ['science'],
};
const config = {
  accounts: ['ivan'],
  include: [],
  exclude: ['ivan/Resonance'],
  overrides: {},
  documents: [],
};

test('discovery excludes private repositories, forks, and explicit exclusions', () => {
  assert.ok(shouldImport(repo, config));
  for (const changes of [
    { private: true },
    { fork: true },
    { disabled: true },
    { full_name: 'IVAN/resonance' },
  ]) {
    assert.equal(shouldImport({ ...repo, ...changes }, config), false);
  }
});

test('only publishing folders are routed; working research and operational Markdown stay on GitHub', () => {
  assert.deepEqual(classifyDocument('content/blogs/one/note.md', 'example'), {
    collection: 'writing',
    id: 'example/one/note',
  });
  assert.deepEqual(classifyDocument('certificates/award.md', 'example'), {
    collection: 'certifications',
    id: 'example/award',
  });
  for (const file of [
    'research/unfinished-paper.md',
    'docs/decisions.md',
    'AGENTS.md',
    'README.md',
    'blogs/README.md',
  ]) {
    assert.equal(classifyDocument(file, 'example'), null);
  }
});

test('metadata preserves explicit draft status and distinguishes repository timestamps from publication dates', () => {
  const markdown = '---\ntitle: A note\ndraft: true\n---\n\n# Details';
  assert.equal(splitMarkdown(markdown).body.trim(), '# Details');
  const entry = makeEntry(
    repo,
    'blogs/note.md',
    markdown,
    'main',
    {},
    { collection: 'writing', slug: 'example/note' },
  );
  assert.equal(entry.data.draft, true);
  assert.equal(entry.data.dateLabel, 'Repository updated');
  assert.equal(entry.data.date, repo.pushed_at);
  assert.equal(
    makeEntry(repo, 'README.md', '', 'main').data.dateLabel,
    'Repository created',
  );
  assert.throws(() => splitMarkdown('---\n- array\n---\ncontent'), /mapping/);
});

test('imported HTML drops executable markup and resolves source-relative links and images', () => {
  const source = {
    repo: 'ivan/Example',
    path: 'docs/README.md',
    revision: 'main',
  };
  const routes = new Map([
    ['ivan/example:papers/result.md', '/papers/example/result/'],
  ]);
  const html = sanitizeRepositoryHtml(
    '<script>alert(1)</script><iframe src="https://evil.test"></iframe><p onclick="bad()">Text</p><a href="javascript:bad()">bad</a><a href="../papers/result.md#result">Paper</a><img src="images/plot.png" onerror="bad()"><a href="/ivan/Example/issues">Issues</a>',
    source,
    routes,
  );
  assert.doesNotMatch(html, /<script|<iframe|onclick|onerror|javascript:/);
  assert.match(html, /href="\/papers\/example\/result\/#result"/);
  assert.match(
    html,
    /src="https:\/\/raw.githubusercontent.com\/ivan\/Example\/main\/docs\/images\/plot.png"/,
  );
  assert.match(html, /href="https:\/\/github.com\/ivan\/Example\/issues"/);
});

test('repository and collection Markdown are retrieved with one shared discovery, and tokens stay on the API host', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url.includes('/users/'))
      return Response.json([
        repo,
        { ...repo, full_name: 'ivan/Private', private: true },
      ]);
    if (url.includes('/git/trees/'))
      return Response.json({
        sha: 'tree-hash',
        tree: [
          { type: 'blob', path: 'README.md', size: 50 },
          { type: 'blob', path: 'blogs/note.md', size: 50 },
          { type: 'blob', path: 'research/work-in-progress.md', size: 50 },
        ],
      });
    return new Response(
      url.endsWith('/README.md') ? '# Example\n\nReadme.' : '# A note\n\nBody.',
    );
  };
  const entries = await importRepositories(config, {
    fetcher,
    token: 'test-only-token',
  });
  assert.deepEqual(
    entries.map((entry) => `${entry.collection}/${entry.id}`),
    ['projects/example', 'writing/example/note'],
  );
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(
      call.options.headers.Authorization,
      call.url.startsWith('https://api.github.com/')
        ? 'Bearer test-only-token'
        : undefined,
    );
  }
});

test('API failures stop a rebuild rather than silently removing published entries', async () => {
  await assert.rejects(
    importRepositories(config, {
      fetcher: async () => new Response('', { status: 403 }),
    }),
    /import failed \(403\)/,
  );
});

test('source removal is reflected by the next discovery instead of cached stale content', async () => {
  assert.deepEqual(
    await importRepositories(config, {
      fetcher: async () => Response.json([]),
    }),
    [],
  );
});
