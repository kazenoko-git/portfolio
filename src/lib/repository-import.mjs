import { parse as parseYaml } from 'yaml';
import sanitizeHtml from 'sanitize-html';
import path from 'node:path';

const folders = {
  projects: 'projects',
  papers: 'papers',
  blogs: 'writing',
  writing: 'writing',
  certifications: 'certifications',
  certificates: 'certifications',
};
const maxDocumentBytes = 256 * 1024;

export const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
const key = (value) => value.toLowerCase();

export function shouldImport(repo, config) {
  return (
    repo.private === false &&
    !repo.fork &&
    !repo.disabled &&
    !config.exclude.some((name) => key(name) === key(repo.full_name))
  );
}

export function splitMarkdown(markdown) {
  const match = markdown.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const data = match ? parseYaml(match[1], { maxAliasCount: 20 }) : {};
  if (data && (typeof data !== 'object' || Array.isArray(data))) {
    throw new Error('Markdown frontmatter must be a mapping');
  }
  return {
    data: data ?? {},
    body: match ? markdown.slice(match[0].length) : markdown,
  };
}

export function classifyDocument(file, repoSlug) {
  const match = file.match(
    /^(?:content\/)?(projects|papers|blogs|writing|certifications|certificates)\/(.+)\.md$/i,
  );
  if (!match || /(^|\/)readme$/i.test(match[2])) return null;
  return {
    collection: folders[match[1].toLowerCase()],
    id: `${repoSlug}/${slugify(match[2])}`,
  };
}

function text(value) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function makeEntry(
  repo,
  file,
  markdown,
  revision,
  override = {},
  document = {},
) {
  const { data, body } = splitMarkdown(markdown);
  const project = document.collection === undefined;
  const title =
    override.title ??
    data.title ??
    (project
      ? repo.name
      : text(
          body.match(/^#\s+(.+)$/m)?.[1] ?? path.posix.basename(file, '.md'),
        ));
  const abstract = body.match(
    /^##\s+(?:\d+\.\s+)?Abstract\s*\n+([\s\S]*?)(?=\n(?:##|---)|$)/im,
  )?.[1];
  const summary =
    override.summary ??
    data.summary ??
    (project
      ? repo.description
      : abstract &&
        `${text(abstract)
          .slice(0, 280)
          .replace(/\s+\S*$/, '')}…`) ??
    `Documentation from ${repo.full_name}.`;
  const source = {
    repo: repo.full_name,
    path: file,
    revision,
    url: `https://github.com/${repo.full_name}/blob/${revision}/${file}`,
    updatedAt: repo.pushed_at ?? repo.created_at,
  };
  // Select metadata explicitly: repository frontmatter never supplies rendered HTML.
  const metadata = Object.fromEntries(
    [
      'tags',
      'status',
      'draft',
      'category',
      'technologies',
      'authors',
      'abstract',
      'publicationStatus',
      'issuer',
      'credentialUrl',
      'pdfUrl',
      'projectPeriod',
      'projectMonth',
    ]
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
  return {
    collection: document.collection ?? 'projects',
    id: document.slug ?? override.slug ?? slugify(repo.name),
    body,
    data: {
      title,
      summary,
      date:
        data.date ??
        (project ? repo.created_at : (repo.pushed_at ?? repo.created_at)),
      dateLabel: data.date
        ? 'Published'
        : project
          ? 'Repository created'
          : 'Repository updated',
      tags: repo.topics ?? [],
      status:
        document.publicationStatus ??
        (repo.archived ? 'Archived repository' : 'Repository documentation'),
      draft: false,
      category: repo.language ?? 'Software',
      technologies: repo.language ? [repo.language] : [],
      repoUrl: repo.html_url,
      ...repositoryCover(body, source),
      ...(override.projectPeriod
        ? {
            projectPeriod: override.projectPeriod,
            projectMonth: override.projectMonth,
          }
        : {}),
      ...(document.collection === 'papers'
        ? {
            authors: document.authors ?? [],
            abstract: abstract ? text(abstract) : summary,
            publicationStatus:
              document.publicationStatus ?? 'Repository document',
          }
        : {}),
      ...(document.collection === 'certifications'
        ? { issuer: 'Issuer not specified in source' }
        : {}),
      ...metadata,
      source,
    },
  };
}

export function repositoryCover(body, source) {
  const candidates = [
    ...body.matchAll(
      /!\[([^\]]*)\]\(([^\s)]+)(?:\s+[^)]*)?\)|<img\b[^>]*\bsrc=["']([^"']+)["']/gi,
    ),
  ]
    .map((match) => ({ alt: match[1] ?? '', url: match[2] ?? match[3] }))
    .filter(
      (image) =>
        !/shields\.io|badge|license|favicon|react\.svg|vite\.svg|tauri\.svg/i.test(
          image.url,
        ),
    );
  const image =
    candidates.find((image) =>
      /figure|screenshot|hero|chart|plot|graph/i.test(image.url),
    ) ?? candidates[0];
  if (!image) return {};
  const cover = rewriteSourceUrl(image.url, source, true);
  if (!/^https:\/\//.test(cover)) return {};
  return {
    cover,
    coverAlt: image.alt || `Image from ${source.repo}`,
    coverCaption: `From the ${source.repo.split('/')[1]} repository`,
  };
}

export function rewriteSourceUrl(
  value,
  source,
  image = false,
  routes = new Map(),
) {
  if (!value || value.startsWith('#')) return value;
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) {
    return /^(https?:|mailto:)/i.test(value) ? value : '';
  }
  const resolved = new URL(
    value,
    `https://github.com/${source.repo}/blob/${source.revision}/${source.path}`,
  );
  const prefix = `/${source.repo}/blob/${source.revision}/`;
  const file = resolved.pathname.slice(prefix.length);
  if (resolved.pathname.startsWith(prefix)) {
    const route = routes.get(`${key(source.repo)}:${decodeURIComponent(file)}`);
    if (!image && route) return route + resolved.hash;
    if (image)
      return `https://raw.githubusercontent.com/${source.repo}/${source.revision}/${file}${resolved.search}${resolved.hash}`;
  }
  return resolved.href;
}

export function sanitizeRepositoryHtml(html, source, routes = new Map()) {
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'details',
      'summary',
      'del',
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['id', 'class'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'],
      span: ['class', 'style'],
      pre: ['class', 'style', 'tabindex'],
    },
    allowedStyles: {
      '*': {
        color: [/^#[a-f\d]{3,8}$/i],
        'background-color': [/^#[a-f\d]{3,8}$/i],
      },
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => {
        const value = attributes.href;
        let fragment = value?.slice(1);
        try {
          fragment = decodeURIComponent(fragment ?? '');
        } catch {
          /* Keep malformed source fragments on GitHub. */
        }
        const href =
          value?.startsWith('#') && !ids.has(fragment)
            ? `${source.url ?? `https://github.com/${source.repo}/blob/${source.revision}/${source.path}`}${value}`
            : rewriteSourceUrl(value, source, false, routes);
        return { tagName, attribs: { ...attributes, href } };
      },
      img: (tagName, attributes) => ({
        tagName,
        attribs: {
          ...attributes,
          src: rewriteSourceUrl(attributes.src, source, true),
          loading: 'lazy',
        },
      }),
    },
  });
}

/**
 * @param {object} config
 * @param {{fetcher?: typeof fetch, token?: string, log?: (message: string) => void}} options
 */
export async function importRepositories(
  config,
  { fetcher = fetch, token, log = console.info } = {},
) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'kazenoko-portfolio',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  async function request(url, optional = false) {
    const isApi = new URL(url).hostname === 'api.github.com';
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetcher(url, {
        headers: isApi ? headers : { 'User-Agent': headers['User-Agent'] },
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok || response.status < 500) break;
    }
    if (
      optional &&
      (response.status === 404 ||
        (response.status === 409 && url.includes('/git/trees/')))
    )
      return null;
    if (!response.ok)
      throw new Error(`Repository import failed (${response.status}): ${url}`);
    return response;
  }
  const repos = new Map();
  for (const account of config.accounts) {
    for (let page = 1; ; page++) {
      const response = await request(
        `https://api.github.com/users/${encodeURIComponent(account)}/repos?type=owner&per_page=100&page=${page}`,
      );
      const batch = await response.json();
      for (const repo of batch)
        if (shouldImport(repo, config)) repos.set(key(repo.full_name), repo);
      if (batch.length < 100) break;
    }
  }
  for (const name of config.include) {
    if (repos.has(key(name))) continue;
    const response = await request(
      `https://api.github.com/repos/${name}`,
      true,
    );
    if (!response) continue;
    const repo = await response.json();
    if (shouldImport(repo, config)) repos.set(key(repo.full_name), repo);
  }
  const entries = [];
  // Sequential API requests keep the unauthenticated Pages build below burst limits.
  for (const repo of [...repos.values()].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  )) {
    const override =
      Object.entries(config.overrides).find(
        ([name]) => key(name) === key(repo.full_name),
      )?.[1] ?? {};
    const ref = override.ref ?? repo.default_branch;
    const response = await request(
      `https://api.github.com/repos/${repo.full_name}/git/trees/${encodeURIComponent(ref)}`,
      true,
    );
    if (!response) {
      log(`No readable branch: ${repo.full_name}/${ref}`);
      continue;
    }
    const tree = await response.json();
    if (tree.truncated)
      throw new Error(`Repository tree is truncated: ${repo.full_name}`);
    const items = [...tree.tree];
    for (const directory of tree.tree.filter(
      (item) =>
        item.type === 'tree' &&
        (item.path === 'content' ||
          Object.hasOwn(folders, item.path.toLowerCase())),
    )) {
      const subtreeResponse = await request(
        `https://api.github.com/repos/${repo.full_name}/git/trees/${directory.sha}?recursive=1`,
      );
      const subtree = await subtreeResponse.json();
      if (subtree.truncated)
        throw new Error(
          `Publishing folder tree is truncated: ${repo.full_name}/${directory.path}`,
        );
      items.push(
        ...subtree.tree.map((item) => ({
          ...item,
          path: `${directory.path}/${item.path}`,
        })),
      );
    }
    const files = items.filter(
      (item) => item.type === 'blob' && /\.md$/i.test(item.path),
    );
    for (const doc of config.documents.filter(
      (doc) => key(doc.repo) === key(repo.full_name),
    )) {
      if (!files.some((item) => item.path === doc.path))
        files.push({ type: 'blob', path: doc.path });
    }
    const readme = files.find((item) => /^readme\.md$/i.test(item.path));
    const slug = override.slug ?? slugify(repo.name);
    const selections = files.flatMap((item) => {
      const explicit = config.documents.find(
        (doc) =>
          key(doc.repo) === key(repo.full_name) && doc.path === item.path,
      );
      const classified = classifyDocument(item.path, slug);
      return item === readme || explicit || classified
        ? [
            {
              item,
              document:
                explicit ??
                (classified ? { ...classified, slug: classified.id } : {}),
            },
          ]
        : [];
    });
    // A repo with an empty README still gets a source link and repository metadata.
    if (!readme)
      selections.unshift({
        item: { path: 'README.md', size: 0 },
        document: {},
        missing: true,
      });
    for (const selection of selections) {
      const { item, document } = selection;
      if (item.size > maxDocumentBytes)
        throw new Error(
          `Markdown exceeds 256 KiB: ${repo.full_name}/${item.path}`,
        );
      const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/${encodeURIComponent(ref)}/${item.path.split('/').map(encodeURIComponent).join('/')}`;
      const raw = selection.missing ? null : await request(rawUrl);
      const markdown = raw ? await raw.text() : '';
      if (Buffer.byteLength(markdown) > maxDocumentBytes)
        throw new Error(`Markdown exceeds 256 KiB: ${rawUrl}`);
      const entry = makeEntry(
        repo,
        item.path,
        markdown,
        ref,
        override,
        document,
      );
      // Do not inherit a project display title into its separate papers/articles.
      if (document.collection)
        Object.assign(
          entry,
          makeEntry(repo, item.path, markdown, ref, {}, document),
        );
      if (selection.missing) entry.data.source.url = repo.html_url;
      entries.push(entry);
    }
  }
  const ids = new Set();
  for (const entry of entries) {
    const id = `${entry.collection}/${entry.id}`;
    if (ids.has(id)) throw new Error(`Duplicate imported content URL: ${id}`);
    ids.add(id);
  }
  log(
    `Imported ${entries.length} entries from ${repos.size} public repositories`,
  );
  return entries;
}
