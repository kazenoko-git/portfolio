# kazenoko.me — Personal Website & Digital Laboratory

> **Project brief for a coding agent (Zed / Codex / Antigravity).** Build a fast, accessible, distinctly personal portfolio and technical writing website. The centerpiece is a procedural wireframe city that transforms, through scrolling, into an ASCII portrait of the creator. The site must also be useful as a conventional publication platform, especially for a Hack Club ASIC neuromorphic NPU design report.

## 1. Product vision

**Not a generic portfolio.** The homepage is an interactive journey from *things I've made* to *the person who made them*:

1. Enter a stylized procedural city, experienced as a fisheye-lens camera speeding along a straight road.
2. Buildings carry billboards/posters featuring actual project artwork, research/paper covers, and certificates.
3. Scrolling progressively lifts the camera into an overhead city view.
4. City geometry dissolves/reorganizes into ASCII characters that form a portrait of me.
5. The portrait takes the left of a clean about/overview section; the right provides my identity, interests, current work, selected latest projects/posts, links, and contact information.
6. Conventional, separately navigable pages house writing, projects, papers, and certifications.

**Design thesis:** Everything is a representation of an underlying system: city geometry → overhead map → character grid → identity. Engineering diagrams, publications, and software projects share the same visual language.

**Domain:** `kazenoko.me`. This is a personal identity independent of the Wingit company domain (`wingit.tech`).

## 2. Design language

### Tone
- Experimental, computational, architectural, editorial; precise but not corporate.
- Minimal Swiss/Japanese editorial sensibility paired with technical/CAD-like wireframes.
- Avoid generic developer-portfolio tropes: gradient blobs, glassmorphism everywhere, purple glowing cards, unnecessary loading screens, vague marketing copy.
- Default direction: **architectural wireframe with a few deliberately imperfect, expressive details**, rather than full cyberpunk clutter.

### Proposed visual system (adjustable)
- Background: near-black/charcoal for the city; warm off-white or deep charcoal for reading surfaces. Test both as a coherent theme.
- Lines: restrained, high-contrast fine strokes; selective use of thicker structural lines.
- Accent: one controlled accent color (e.g. vermilion/red-orange); primarily for navigation, selected objects, and interactive states, not indiscriminate decoration.
- Typography: a high-quality display sans for headlines, a readable text face for articles, and a monospace face for labels, data, diagrams, and ASCII art. Japanese `風の子` can appear as an identity detail, not gratuitous ornament.
- Layout: generous whitespace, asymmetry where intentional, grid-based alignment, small uppercase technical metadata, section index numbers, sharp transitions between cinematic and editorial modes.
- Motion: physically understandable, smooth, reversible, tied to scroll progress—not random entrance animations.

### Component patterns
- Thin rules and index labels: `01 / WORK`, `02 / WRITING`.
- Project titles with short, legible metadata: `ASIC · NEUROMORPHIC COMPUTING · 2026`.
- Cover art appears *as art*, not forced into tiny uniform cards.
- Clear link styling and visible focus states.

## 3. Homepage experience / storyboard

### Phase A — `THE CITY` (opening)
- Full-width / nearly full-viewport immersive canvas with a clearly accessible fallback.
- A camera looks forward down a **straight road** between procedurally generated buildings.
- Strong wide-angle/fisheye distortion, but keep horizon, roadway, and billboard imagery legible.
- Forward motion feels fast and fluid. Avoid inducing nausea: limit sudden acceleration and oscillation; offer pause/reduced-motion behavior.
- Render city primarily as **2D line-drawn / wireframe imagery with 3D perspective cues**. This is a *2D visual aesthetic*, not a requirement to prohibit 3D internals.
- Buildings vary in height, depth, setback, rooftop silhouette, facade segmentation, and outline density.
- Taller buildings contain billboards/advertisements displaying real covers for projects, papers, certificates, or articles.
- Billboard art should be recognizable and include accessible corresponding links outside the canvas.
- The city should be deterministic/seeded so important works stay discoverable, rather than disappearing in arbitrary procedural layout.

**Interaction model:** Scroll advances the cinematic experience. Pointer hover or keyboard focus can select a billboard; selection reveals a project name and brief metadata. Clicking/tapping a selected billboard opens its detail page. Never require precise mid-animation clicking; consider slowing/locking a selected target or providing a persistent selectable list overlay. Mobile: first tap selects, second tap navigates, or use an explicit visible “Open” link. Support keyboard access using an HTML mirror/list for the same featured items.

### Phase B — `THE ASCENT` (scroll)
- Forward speed diminishes while the camera smoothly pitches and ascends.
- Perspective transitions continuously into a **top-down city map**.
- Buildings flatten visually into footprints; roads become lines in a graphic grid.
- No hard scene cut. The transformation must look coherent in either scroll direction.

### Phase C — `THE ENCODING` (scroll)
- Street lines, building footprints, and grid marks fragment into dots/short strokes/glyph-like marks.
- Shapes gradually reorganize into an ASCII character field.
- The character field resolves into a recognizable portrait of me.
- Prefer a continuous morph made from a shared spatial lattice/particle or glyph system instead of crossfading between unrelated images.
- The portrait source photo will be supplied later. **Until provided, use an explicitly labeled placeholder/silhouette**—do not invent my likeness.
- Prepare the ASCII portrait from a real portrait in a build script or offline preprocessing step; keep it crisp and reproducible.

### Phase D — `THE PERSON` (settled content)
- ASCII portrait occupies the **left** on wide screens and stacks **above** text on narrow screens.
- Right column includes:
  - Name/handle: `kazenoko` (final display name TBD)
  - One strong personal statement, not generic “passionate developer” copy
  - About: what I do and what fascinates me (silicon, neuromorphic computing, software, systems, research)
  - What I'm working on now: first design of my neuromorphic NPU for Hack Club ASIC
  - Latest project previews, blog posts, papers
  - GitHub/social links and contact email (placeholders until supplied)
- This becomes a stable, readable part of the page. Motion becomes subtle.
- A site header and clear links to all content sections remain available irrespective of scroll position.

### Indicative normalized scroll mapping
These are conceptual starting values **not rigid timing requirements**. Use testing to tune pacing.

| Scroll progress | Narrative state |
|---|---|
| 0–30% | Travel through city; billboard discovery |
| 30–50% | Decelerate, rise, tilt toward overhead |
| 50–70% | Flatten map geometry into lines/marks |
| 70–85% | Marks reorganize into ASCII |
| 85–100% | Portrait settles left; about content reveals right |

Scroll progress should be controlled by a dedicated pinned scene section (e.g. several viewport heights), followed by ordinary document flow. Direct deep links must **not** replay the cinematic sequence.

## 4. Site map and content model

| Path | Role |
|---|---|
| `/` | Cinematic city + morph + identity/overview |
| `/writing` | Index of blogs, build logs, engineering notes |
| `/writing/<slug>` | MDX blog article; initial priority: neuromorphic NPU ASIC design report |
| `/projects` | Filterable/listed projects with images and technical details |
| `/projects/<slug>` | Individual project case study |
| `/papers` | Research papers, preprints, writeups with links/downloads as applicable |
| `/papers/<slug>` | Paper overview / abstract / references / links |
| `/certifications` | Certificates with issuer, date, evidence links, optional image |
| `/about` | Optional standalone non-animated biography accessible directly |
| `/contact` | Optional dedicated contact page; contact must also appear on homepage |

**Content should be data-driven:** Featured billboards and latest posts draw from the same project/paper/certificate/article content definitions that power the ordinary pages. No duplicate hard-coded information.

### Suggested content properties
- Universal: `title`, `slug`, `summary`, `date`, `tags`, `cover`, `featured`, `featuredOrder`, `status`, `links`.
- Projects: `category`, `technologies`, `repoUrl`, `demoUrl`, `designNotes`, `gallery`.
- Writing: `description`, `publishedAt`, `updatedAt`, `draft`, `series`, `readingTime` (calculated).
- Papers: `authors`, `abstract`, `publicationStatus`, `pdfUrl`, `doi` (if any), `citation` (if any).
- Certifications: `issuer`, `issuedAt`, `credentialUrl`, `image`, `credentialId` (optional; avoid publishing sensitive identifiers).
- Billboard metadata: `entityType`, `entitySlug`, `art`, `label`, `priority`, `placement`.

## 5. Initial priority article: Neuromorphic NPU ASIC design report

The first usable release **must publish the Hack Club ASIC report**, even if the cinematic homepage is still in progress.

Suggested article skeleton (fill with actual, verified design details—not invented specifications):
1. Overview and motivation
2. What problem the NPU is meant to solve
3. Architecture: block diagram and main datapath
4. Neuron/synapse representation and numerical choices
5. Control, memory, and communication design
6. RTL/module structure and interfaces
7. Simulation and verification methodology
8. Current results, evidence, waveforms, and limitations
9. Tradeoffs and next iteration
10. Repository, references, and acknowledgements

Article UX requirements:
- Code blocks with copy buttons and optional file labels
- Syntax-highlighted Verilog/SystemVerilog and other languages
- Figures, captions, diagrams, waveform images, tables, equations (where needed)
- Table of contents, heading anchors, reading progress or position indicator (optional)
- Comfortable typography and line length, mobile-friendly diagrams
- Open Graph / social sharing metadata
- No autoplay effects in technical reading views

## 6. Recommended technical architecture

**Default suggestion (not mandatory):**
- Astro + TypeScript for the overall site (fast static routes and MDX content collections).
- MDX for writing and technical case studies.
- Tailwind CSS plus intentionally authored CSS tokens/components for identity.
- Three.js for the wireframe city and camera path, with custom shaders *only where needed* for wide-angle lens distortion and transitions.
- GSAP + ScrollTrigger **or** a small custom scroll-progress controller for the pinned cinematic timeline. Choose one clear state owner; don't couple animation to component re-renders.
- Canvas/WebGL or DOM-based monospace glyph rendering for the final ASCII portrait; compare accessibility, performance, and quality.
- Deploy static pages on Cloudflare Pages (or equivalent static host).

### Rendering guidelines
- Build procedural city chunks around the camera, recycling objects as they travel out of view; generate from a stable seed.
- Use shared buffers, instancing/batched drawing, a limited number of materials/draw calls, and distance-based detail reduction.
- Distinguish core building wireframes from billboards, which need legible imagery.
- Use a texture atlas or carefully loaded textures for project covers; limit texture sizes and total memory.
- Keep GPU/CPU budget practical on mid-range mobiles and integrated graphics.
- Fisheye effect should preserve a usable center and avoid excessive blur near edges. Implement as a controlled lens projection / postprocess, not a constant screen wobble.
- Keep one canonical `progress ∈ [0,1]` value for cinematic interpolation; derive camera position, pitch, field distortion, geometry state, and portrait morph from it. Reversible scrolling should yield deterministic frames.
- Use easing inside timeline intervals, not dependence on frame-rate or variable scroll velocity.
- Separate content data, presentation components, procedural city logic, morph logic, and page routing.
- Respect device pixel ratio with a cap; pause rendering when tab is hidden or scene offscreen.
- Don’t render 1 mesh and draw call per window or building line; batch geometry.

### Important open engineering choice
A *true per-glyph ASCII morph* from arbitrarily located 3D lines is harder than a simple opacity transition. Prototype this first. A convincing compromise is to project the overhead city into a common 2D grid and gradually replace per-cell line/edge intensity with glyphs using a shared grid, then interpolate character density toward the portrait target. This retains narrative continuity while staying practical.

## 7. Usability, accessibility, and resilience (non-negotiable)

- Persistent or easily accessed global navigation: Home, Writing, Projects, Papers, Certifications, Contact.
- Let visitors **skip animation** to reach work/about content immediately.
- Honor `prefers-reduced-motion`; serve a static city visual or still illustration and a directly readable profile.
- Clear loading fallback when WebGL is unavailable, slow, or crashes; do not render a blank homepage.
- All major content is ordinary semantic HTML, indexed and accessible without WebGL.
- Every interactive billboard must have an equivalent visible or screen-reader-accessible HTML link.
- Keyboard operation, focus indicators, screen-reader labels, legible contrast, and touch targets.
- Mobile-specific layout and manageable graphics complexity; no forced horizontal overflow.
- No scroll hijacking that blocks natural navigation; scroll-to-progress mappings must be stable and allow reversing.
- Support deep-link access to posts and projects without having to view the homepage.
- Avoid collecting analytics or personal data by default; if analytics are added, use privacy-respecting options.
- Optimize metadata, canonical links, sitemap, RSS feed for writing, share cards, and article dates.

## 8. Build order / release milestones

### M0 — Content foundation (**ship first**)
- Initialize Astro + TS + MDX + styling system.
- Build functional global nav and routes.
- Add content collections and MDX post template.
- Publish the Neuromorphic NPU report with figures and source links.
- Deploy to `kazenoko.me` once domain is purchased/configured.
- Success = report link can be shared with Hack Club now.

### M1 — Visual system and conventional portfolio
- Implement editorial visual language, typography, grids, and components.
- Populate projects/papers/certifications indexes from content data.
- Add accessible about/profile section and featured work.
- Create reliable mobile layouts, metadata, RSS, and sitemap.

### M2 — City prototype
- Build a standalone city scene with road, buildings, variable height, line-work, and fisheye camera.
- Seed deterministic city and map actual featured content to billboards.
- Profile desktop/mobile rendering before elaborating visuals.
- Add billboard interaction + synchronized accessible HTML links.

### M3 — Camera choreography
- Link one normalized scroll progress value to forward motion, camera ascent, pitch, and top-down composition.
- Make reverse scroll deterministic.
- Add skip, pause where appropriate, reduced-motion mode, and static fallback.

### M4 — ASCII transformation
- Create portrait preprocessing pipeline after a real photo is provided.
- Prototype overhead-grid → ASCII field → portrait appearance.
- Compose responsive left-portrait / right-about layout.
- Test continuously through forward and reverse scrolling.

### M5 — Polish and release
- Performance budgets; optimize batching, texture memory, and paint/JS work.
- Accessibility testing (keyboard, screen reader, reduced-motion, small screens).
- Cross-browser testing, web vitals, SEO and Open Graph screenshots.
- Refinement of micro-interactions, errors, and loading state.

## 9. Agent instructions / definition of done

**Do not start by building the most visually impressive animation.** First create a polished, working site and publication pipeline that can host the ASIC report. Then prototype the hardest technical risk—continuous geometry-to-ASCII morph—before committing to the full cinematic design.

When implementation begins:
1. Propose a concrete repo structure and dependency list.
2. Build in small running milestones; avoid a monolithic homepage component.
3. Keep content editable as Markdown/MDX with frontmatter (or typed collections).
4. Use honest placeholders for unknown personal details, links, credentials, portrait, and project assets.
5. Include a short README documenting development, adding articles/projects, editing featured billboards, changing the seed, and deployment.
6. Validate build, typecheck, lint, navigation, and mobile/reduced-motion behavior before declaring completion.
7. Do not fabricate research findings, papers, achievements, credentials, performance numbers, or ASIC results.

**Acceptance criteria:**
- [ ] A standalone technical blog post is publishable and readable.
- [ ] Projects, papers, and certificates have usable browsable index pages.
- [ ] The homepage provides a compelling procedural line-drawn city with recognizable project billboards.
- [ ] Scroll produces coherent city → overhead → ASCII portrait → about progression.
- [ ] Reverse scroll works without glitches or unpredictable procedural changes.
- [ ] Name, interests, current work, latest writing/projects, and contact are accessible without relying on the animation.
- [ ] Website remains usable on mobile, with reduced motion, without WebGL, and via keyboard.
- [ ] Adding a featured project can update both a page listing and a city billboard through shared content metadata.
- [ ] Performance is reasonable on typical laptops and mid-range phones.

## 10. Explicitly not decided yet

The implementer should keep these configurable rather than invent permanent choices:
- Actual portrait/photo and desired ASCII character set
- Final display name, tagline, bio, and contact/social URLs
- Exact accent color, fonts, dark/light article theme
- Cover art for projects and research; certificates and evidence URLs
- Scope of hover/tap billboard interactivity in first release
- Whether a standalone `/about` route is wanted
- The precise technical method for the geometry→ASCII morph (benchmark prototype alternatives)

---

**One-sentence direction:** `kazenoko.me` is a personal digital laboratory where visitors drive through a procedural city of my work, zoom out into its underlying structure, and watch that structure resolve into an ASCII representation of the person behind it—then explore fast, accessible pages for blogs, projects, papers, and certifications.
