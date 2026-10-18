# Publish Markdown from GitHub

The portfolio repository is the content source. Add a Markdown file, commit it,
and push to `main`. GitHub validates the site and triggers a Cloudflare Pages
build. Pages retrieves `portfolio/main`, builds it, and publishes generated HTML
to <https://kazenoko.pages.dev>.

This is build-time publishing. The browser does not fetch GitHub on every visit.
It keeps pages readable without JavaScript and avoids depending on a GitHub API
request for every reader.

## Folder routing

| Put `.md` or `.mdx` here                                     | Appears under       |
| ------------------------------------------------------------ | ------------------- |
| `src/content/projects/`                                      | `/projects/`        |
| `src/content/blogs/` or `src/content/writing/`               | `/writing/` (Blogs) |
| `src/content/papers/`                                        | `/papers/`          |
| `src/content/certifications/` or `src/content/certificates/` | `/certifications/`  |

The filename supplies the URL. A file named `projects/solar-audit.md` becomes
`/projects/solar-audit/`. Nested folders are preserved. Do not use the same path
in both aliases of a collection. For example, choose either `blogs/update.md`
or `writing/update.md`, not both.

Only these content folders are published. Working documents under `docs/`,
scripts, repository READMEs, evidence folders, and manuscript drafts are not
automatically turned into public pages.

## Project example

```md
---
title: My project
summary: What it does and why I built it.
date: 2026-10-18
category: Software
technologies: [Python]
tags: [Tools]
status: In development
repoUrl: https://github.com/kazenoko-git/REPOSITORY
draft: false
---

## What I built

Explain the project here.
```

Use the entry's publication date for `date`; describe a month-only project start
date in the body instead of inventing a day. `repoUrl` creates a visible source
link and source-code metadata. The same entry supplies its collection preview,
homepage/city listing, and sitemap URL; there is no second registry to update.

## Other entry types

All entries require `title`, `summary`, and `date`.

- Blogs: set `draft: false` when ready. Blogs default to draft.
- Papers: also supply `authors: [Ivan Samuel]`, `abstract`, and
  `publicationStatus`, such as `Preliminary report`.
- Awards/certificates: also supply `issuer`. Use the award/issue date in `date`.
- Images: put files in `public/images/` and use `cover: /images/example.jpg` or a
  Markdown image with descriptive alternative text.
- Downloads: put a reviewed public document in `public/papers/` and link to
  `/papers/document.pdf` from Markdown. A local `docs/` file is not a download.

Set `draft: true` on any collection to keep an entry out of published index
results, the city, and the sitemap. Draft detail URLs still render with
`noindex, nofollow` and may be linked as draft outlines. Draft is an editorial
state, not private storage.

## Deployment and checks

Cloudflare Pages production settings:

- Project: `kazenoko`.
- Content/build source: `kazenoko-git/portfolio`, branch `main`.
- Legacy Git connection: `kazenoko-git/Website`. Cloudflare did not update this
  existing connection through its project-update API. The production build
  explicitly clones the public portfolio repository, preserving the existing
  `kazenoko.pages.dev` project and URL.
- Production branch: `main`.
- Build command: shallow-clone `portfolio/main` into `portfolio-source`, enter
  it, run `npm ci`, then `npm run build`.
- Output folder: `portfolio-source/dist`.
- Node: the supported Node 24 line (`.node-version`).
- Pages build variables: `NODE_VERSION=24`, `SKIP_DEPENDENCY_INSTALL=1` (skip
  installing the legacy repository; the explicit build installs portfolio).

The GitHub check workflow validates content, typechecks, lints, builds, and checks
generated links and publishing metadata. Invalid frontmatter fails the build
instead of quietly creating an incomplete page.

After successful checks on `main`, the workflow calls the Pages deploy hook
stored in the GitHub Actions secret `CLOUDFLARE_PAGES_DEPLOY_HOOK`. The hook URL
is never committed. Pull requests run checks without production publishing.
GitHub's workflow confirms that a build was requested; Pages' deployment status
confirms whether that build actually published.

The Pages build selects the latest `portfolio/main` when it starts. Its native
deployment metadata still names the legacy repository, so use the cloned
portfolio commit in the build log to identify the actual site source. This
bridge depends on the public portfolio repository and the legacy Git connection
remaining available. Once Cloudflare supports reconnecting this project, switch
to a direct portfolio connection and restore the simple `npm run build` / `dist`
settings.

For a local preview before pushing:

```sh
npm ci
npm run check
npm run lint
npm run build
npm test
```

## Search discovery

Published entries have server-rendered text, canonical URLs, metadata, and
sitemap entries. Project repository links are ordinary crawlable HTML links.
Structured data associates the site with Ivan Samuel's public profiles and
links projects to their source code.

The sitemap is <https://kazenoko.pages.dev/sitemap.xml>, advertised by
`robots.txt`. Submit it in Google Search Console after verifying ownership of
the site. Google controls whether and when pages or linked GitHub repositories
are indexed; publishing a page or sitemap does not guarantee a search result.

If a custom domain is connected later, change `site.url` and `site.domain` in
`src/lib/site.ts`; Astro's canonicals, sitemap, RSS, and robots endpoint use that
configured origin. Then review redirects and resubmit the sitemap.
