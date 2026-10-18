# kazenoko.me

Personal website and digital laboratory, built with Astro, TypeScript, and MDX. Static output for Cloudflare Pages; no server adapter or runtime database is required.

## Development

Use Node 24.16 or newer within the Node 24 release line (or Node 26.3+) (`.node-version`), then:

```sh
npm ci
npm run dev
```

`npm run check` checks Astro and TypeScript. `npm run lint` runs ESLint. `npm run build` emits `dist/`. Run `npm test` **after building** to check generated links, draft exclusion, and deterministic scene projection. `npm run preview` serves the build with Astro; `npm run preview:cloudflare` serves it using the system-installed Wrangler on port 8788.

## Structure

- `src/content/` — typed MDX collections: writing, projects, papers, certifications.
- `src/content.config.ts` — frontmatter schemas.
- `src/lib/site.ts` — identity, email, social links, navigation.
- `src/layouts/Base.astro` — shared document, SEO, navigation, footer.
- `src/pages/[collection]/` — collection indexes and detail reader.
- `src/components/City.astro` — static architectural drawing and resilient fallback.
- `src/scene/` — experimental seeded city projection and shared city/glyph samples.
- `src/styles/global.css` — design tokens, layout, typography, responsive rules.
- `docs/website-spec.md` — original brief.

## Adding content

Add `src/content/writing/my-slug.mdx`:

```mdx
---
title: A concrete title
summary: A short description of the article.
date: 2026-10-17
tags: [Engineering]
status: Published
draft: false
featured: true
featuredOrder: 2
---

## A heading

Write the article here.
```

The filename determines `/writing/my-slug/`. Heading anchors, a table of contents, reading time, syntax highlighting, and code copy buttons are automatic. Use fenced `verilog` or `system-verilog` blocks, Markdown tables, and `<figure>` / `<figcaption>` for illustrations. Use descriptive `alt` text and store media in `public/images/`. `cover` is an optional image path. `links` takes `{ label, url }` objects.

**Writing defaults to `draft: true`.** Drafts are visible as clearly labeled outlines but excluded from RSS, sitemap, and search indexing. Draft URLs are public, so never put confidential material in them. Set `draft: false` and update `status` only after reviewing the article. Dates must reflect the actual publication date when publishing. The initial ASIC report is an editorial outline, not a verified technical report.

Projects use the common fields plus `category` and `technologies`. Papers require `authors`, `abstract`, and `publicationStatus`; optional `pdfUrl`. Certifications require `issuer`; optional `credentialUrl`. Empty collections intentionally render honest empty states. Do not add invented entries to fill them.

## Updating the portrait

Replace `public/images/portrait.png` with a light-on-transparent or light-on-dark portrait. `npm run dev` and `npm run build` regenerate `src/scene/portrait-data.json` automatically; `npm run portrait:update` regenerates it separately. The generator traces the light strokes into connected centerlines without cropping. The original image stays untouched. Roof outlines morph directly into these paths, and the final SVG uses the exact same paths, proportions, color, and line weight. There is no dot or ASCII stage.

## Automatic homepage and billboards

Add an MDX file to `src/content/projects/`, `papers/`, `certifications/`, or `writing/`. Its title, summary, cover, and URL power both the ordinary pages and the homepage. No separate billboard registry or `featured: true` flag is required. Changes appear after a rebuild/deploy (or automatically in local development).

For a project:

```mdx
---
title: My project
summary: A short description, also used in the hover popup.
date: 2026-10-17
category: Software
cover: /images/my-project.jpg
---

## What I built

The project details go here.
```

Put the cover image in `public/images/`. `cover` is optional: missing art gets an explicitly labeled cover placeholder. Papers and certifications use their additional required schema fields described above. Unpublished writing (`draft: true`) stays out of the city. Set `city: false` to opt an entry out of the city/homepage, or use `featuredOrder` to adjust ordering; default ordering is priority, then newest date, then a stable slug tie-break. All included items receive a building slot; the city expands to accommodate them. Missing collection types have labeled layout samples linking to their index, removed when real entries arrive.

The homepage opens directly into a moving, seeded city. Scrolling controls camera ascent, flattening, the building-footprint → contour portrait morph, and the left portrait / right identity composition. One profile section takes over the same portrait and includes previews and contact. `/lab` points to the homepage rather than hosting a separate entry experience.

- `src/scene/world.ts`: seeded buildings, fisheye projection, curved edge sampling, low road-facing billboard placement, and cover-plane projection. Change `WORLD_SEED` here to alter the city.
- `src/scene/journey.ts`: flight, scroll timeline, billboard focus/hover, popup, and rendering lifecycle.
- `src/components/CityExperience.astro`: accessible billboard links generated from collections.
- `src/components/Profile.astro`: ordinary profile, latest entries, and contact.
- `src/lib/catalog.ts`: automatic inclusion and stable ordering policy.

Hover slows forward movement to 6% speed and shows the description; keyboard focus stops flight. Click a billboard or its popup link to open the detail page. On touch, the first tap selects and the second tap follows the link. Escape or the close button dismisses the popup. Pause and skip controls remain available. Artwork stays attached to the road-facing side of its building during slowdown.

The scene uses one canvas for curved wireframes, HTML links mapped onto the building walls, a capped pixel ratio, and a 64-column neighborhood with at least 4,096 buildings. After the camera tilts, it pulls back while background buildings fade away. Remaining roof edges reshape into connected strokes traced from the supplied portrait, then the completed face settles left. Roofs and portrait strokes are interpolated as geometry, without a separate dot field or picture overlay. The last canvas frame aligns with one static SVG portrait; there is no repeated about section. Distant terrain bends below the horizon, fades out before its bounds, and buildings and their covers share one opacity for distance, lateral falloff, and screen-edge proximity. Both layers use the same viewport mask, with no separate advert easing. Reduced motion and JavaScript-disabled views use the static fallback and ordinary profile. The portrait is traced from the supplied `public/images/portrait.png` artwork and is regenerated automatically during builds.

## Cloudflare Pages

Cloudflare receives generated HTML, CSS, JS, fonts, and images from `dist/`, not raw `.astro` or MDX files.

For Git integration:

- Framework preset: Astro
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: this repository
- Node version: 24 (`.node-version`)

For direct upload using the already-installed Wrangler:

```sh
npm ci
npm run check
npm run lint
npm run build
npm test
wrangler pages deploy dist --project-name YOUR_CONFIRMED_PROJECT_NAME
```

The compatibility date is pinned to `2026-07-21`, the newest supported by the installed Wrangler 4.112.0 local runtime. Advance it after updating Wrangler and rechecking preview.

`wrangler.jsonc` uses `kazenoko` as the proposed project name; change it to the actual Pages project name before deployment if different. No account identifier or credentials are committed. Authentication and project creation must be completed in the intended Cloudflare account. No deployment is performed by a build or test command. Connect `kazenoko.me` through the Pages project's custom-domain settings after deployment. Update `site` in `astro.config.mjs` and `public/robots.txt` if the canonical domain changes.

`404.html` enables a proper missing-page response rather than SPA fallback. `_headers` sets basic browser response policies and immutable caching for hashed assets. Fonts are hosted locally; the site includes no analytics.

## Current state and review

The cinematic homepage, automated content/billboard mapping, and publication templates are implemented. Contact links and project cover artwork are awaiting confirmed material; the portrait uses the supplied face artwork. The ASIC report remains an editorial draft outline until verified design content is supplied.

Typechecking, lint, static builds, generated-link checks, draft exclusion, content inclusion, seeded billboard allocation, curved projection, and side-wall cover mapping have automated checks. Chrome's native UI is available for desktop visual review; the browser extension interface times out in this environment. Mobile, screen reader, and detailed performance review remain outstanding. Empty papers and certifications collections intentionally produce Astro warnings.

The local Node 26.0 runs the checks, but the lint dependencies officially require Node 24.16+ or 26.3+; use the supported Node 24 line for Cloudflare builds.

## Browsing content

Blogs, Projects, Papers, and Certifications share a searchable index. Titles, summaries, and tags are searchable; selecting a tag narrows the results further. Tags and recent previews come directly from each collection, with newest entries first. Draft blogs remain separate from published search results. Add `cover` to an entry to show its artwork in its preview. About links to the homepage profile; Contact uses the email and social links in `src/lib/site.ts`.

### Scene visibility and interaction

`sceneView()` in `src/scene/world.ts` opens the road and city view continuously between scroll progress 0.17 and 0.43. Buildings, adverts, and ground use that view; tall buildings extend farther through street-level haze, and the foreground road stays opaque. Billboard rows use seeded, bounded gaps so the flight loop keeps readable signs in view. Invisible portrait layers cannot intercept pointer events. Profile text stays in native document flow, while the completed contour uses a cached canvas path rather than rebuilding roofs during scrolling.
