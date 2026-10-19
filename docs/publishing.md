# Publish Markdown from GitHub

The site discovers public, original repositories owned by `kazenoko-git` and
imports their READMEs as project documentation. It also imports Markdown in
their publishing folders and the two existing Telos preliminary papers.
`fourtysevencode/prodo` is included explicitly as a team project.

For extra entries or curated summaries, add Markdown to **`content/` at the root
of the portfolio repository**, commit, and push to `main`. GitHub validates the
site and triggers a Cloudflare Pages build. Pages retrieves `portfolio/main`,
builds it, and publishes generated HTML to <https://kazenoko.pages.dev>.

The workflow also checks and rebuilds every six hours (at minute 17 UTC), picking
up changes and new repositories on your account. GitHub may delay scheduled runs.
Use **Actions → Check and publish website → Run workflow** for an immediate
refresh. Local development imports repository content when its server starts;
restart it to refresh remote sources.

This is build-time publishing. The browser does not fetch GitHub on every visit.
It keeps pages readable without JavaScript and avoids depending on a GitHub API
request for every reader.

## Folder routing

| Put `.md` or `.mdx` here                             | Appears under       |
| ---------------------------------------------------- | ------------------- |
| `content/projects/`                                  | `/projects/`        |
| `content/blogs/` or `content/writing/`               | `/writing/` (Blogs) |
| `content/papers/`                                    | `/papers/`          |
| `content/certifications/` or `content/certificates/` | `/certifications/`  |

The filename supplies the URL. A file named `projects/solar-audit.md` becomes
`/projects/solar-audit/`. Nested folders are preserved. Do not use the same path
in both aliases of a collection. For example, choose either `blogs/update.md`
or `writing/update.md`, not both.

### Imported repositories

- The root `README.md` (case insensitive) supplies `/projects/REPO-SLUG/`.
  Repositories without a README get a repository metadata entry; empty Git
  repositories without a readable branch are skipped.
- Other repositories' `.md` files in publishing folders (`content/projects/`,
  `content/papers/`, `content/blogs/`, `content/writing/`,
  `content/certifications/`, `content/certificates/`) go into the corresponding
  collection. Those same folders at the repository root are also recognized.
  Directory READMEs are not separate articles. Remote MDX is not executed.
- Document URLs are namespaced by repository: `telos/blogs/update.md` becomes
  `/writing/telos/update/`. Project slugs and exceptional document paths are
  configured in `config/repositories.json`.
- Repository metadata supplies missing titles, descriptions, and dates. Dates
  without explicit frontmatter are labeled repository-created/updated dates,
  not claimed publication dates. Papers retain their source's preliminary status.
- A local entry with the same collection and slug takes priority. A local project
  with the same `repoUrl` also matches. Its text and metadata stay primary, with
  the imported README below under **Repository documentation**. This preserves
  the Prodo and Klima summaries and awards. Local-only entries also work.
- READMEs are documentation, not independently verified claims. Source links are
  visible. Relative document links point to imported pages when available;
  remaining links and images resolve against GitHub. Imported HTML is sanitized.
- Private repositories, forks, disabled repositories, Resonance, the portfolio,
  and the old Website repository are excluded. The later Godot Eternae repository
  is excluded in favor of Eternae-aurora. Talos reads its `talos_2` branch.
- Arbitrary `docs/` and `research/` files, operational instructions, and working
  manuscripts are not swept into the site. The two published Telos paper paths
  are explicit exceptions. Add further publication-ready material to `content/`.

The importer uses public GitHub endpoints, optionally authenticated with
`GITHUB_TOKEN` for rate limits. It checks visibility even when authenticated.
GitHub Actions uses its built-in token; Cloudflare needs no GitHub secret for
public sources. API errors fail the rebuild and leave the previous deployment
live, rather than silently publishing an incomplete inventory. Removed sources
are removed at the next successful rebuild. A source made private is no longer
imported, though previous public deployments can still exist in Pages history.

## Project example

```md
---
title: My project
summary: What it does and why I built it.
date: 2026-10-18
projectPeriod: Around May–June 2026
projectMonth: 2026-05
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

Use the entry's publication date for `date`. Projects also accept `projectPeriod`
for a human-readable project timeline, including approximate ranges, and
`projectMonth` (`YYYY-MM`) for ordering. Project pages, lists, and the city use
that timeline instead of presenting the page publication date as a project date.
When only GitHub timestamps are available, they are labeled as repository dates.
`repoUrl` creates a visible source
link and source-code metadata. The same entry supplies its collection preview,
homepage/city listing, and sitemap URL; there is no second registry to update.

## Other entry types

All entries require `title`, `summary`, and `date`.

- Blogs: set `draft: false` when ready. Blogs default to draft.
- Papers: also supply `authors: [Ivan Samuel]`, `abstract`, and
  `publicationStatus`, such as `Preliminary report`.
- Awards/certificates: also supply `issuer`. Use the award/issue date in `date`.
- Images: put files in `public/images/` and use `cover: /images/example.jpg` or a
  Markdown image with descriptive alternative text. `coverAlt` describes the
  image and `coverCaption` identifies it as a screenshot, chart, illustration,
  or certificate. Repository imports select source images while ignoring badges.
  Entries without source art use a clearly captioned project illustration.
  These images also appear on the homepage billboards and project previews.
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
- Node: Node 24.16.0 (`.node-version`).
- Pages build variables: `NODE_VERSION=24.16.0`, `SKIP_DEPENDENCY_INSTALL=1` (skip
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
