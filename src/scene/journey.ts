import {
  portraitPhases,
  portraitCells,
  portraitPaths,
  PORTRAIT_STROKE,
  portraitRowAtRank,
  PORTRAIT_COLUMNS,
} from './portrait';
import { clamp, interval } from './geometry';
import { morphRoofToStroke } from './portrait-renderer';
import { portraitPlacement } from './layout';
import { groundCrossSections } from './ground';
import {
  buildWorld,
  overheadRowRanks,
  cameraProject,
  projectCurve,
  billboardFace,
  buildingOpacity,
  sceneryOpacity,
  sceneView,
  billboardIsVisible,
  quadMatrix,
  corners,
  EDGES,
  wrapDepth,
  type Vec,
} from './world';

export function startJourney() {
  const root = document.querySelector<HTMLElement>('[data-journey]');
  const canvas = root?.querySelector<HTMLCanvasElement>('[data-world]');
  if (!root || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cards = [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-billboard]'),
  ];
  const popup = root.querySelector<HTMLElement>('[data-popup]')!;
  const popupTitle = root.querySelector<HTMLElement>('[data-popup-title]')!;
  const popupSummary = root.querySelector<HTMLElement>('[data-popup-summary]')!;
  const popupKind = root.querySelector<HTMLElement>('[data-popup-kind]')!;
  const popupOpen = root.querySelector<HTMLAnchorElement>('[data-popup-open]')!;
  const pause = root.querySelector<HTMLButtonElement>('[data-flight-pause]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const world = buildWorld(cards.length);
  let width = 0,
    height = 0,
    flight = -52,
    speed = 1,
    paused = false,
    active: HTMLAnchorElement | null = null;
  let frame = 0,
    last = 0,
    inView = true,
    leaveTimer: ReturnType<typeof setTimeout> | undefined;
  const profile = document.querySelector<HTMLElement>('#profile')!;
  const profileContent =
    profile.querySelector<HTMLElement>('.profile-content')!;
  const portrait = profile.querySelector<HTMLElement>(
    '[data-profile-portrait]',
  )!;
  const controls = root.querySelector<HTMLElement>('.journey-bottom')!;
  const portraitGrid = profile.querySelector<HTMLElement>(
    '[data-portrait-grid]',
  )!;
  const facePath = new Path2D();
  for (const path of portraitPaths)
    path.forEach((p, i) => {
      if (i) facePath.lineTo(p.x, p.y);
      else facePath.moveTo(p.x, p.y);
    });
  let currentView = sceneView(0, world.length);
  let currentZoom = 0,
    portraitOffset = 0;
  function select(card: HTMLAnchorElement | null) {
    if (leaveTimer) clearTimeout(leaveTimer);
    if (active === card) return;
    active?.classList.remove('selected');
    active = card;
    popup.hidden = !card;
    if (card) {
      card.classList.add('selected');
      popupTitle.textContent = card.dataset.title ?? '';
      popupSummary.textContent = card.dataset.summary ?? '';
      popupKind.textContent = card.dataset.kind ?? '';
      popupOpen.href = card.href;
    }
    requestDraw();
  }
  function deferClose() {
    leaveTimer = setTimeout(() => {
      const focus = document.activeElement;
      if (
        !popup.matches(':hover') &&
        !active?.matches(':hover') &&
        !popup.contains(focus) &&
        focus !== active
      )
        select(null);
    }, 180);
  }
  cards.forEach((card) => {
    card.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'touch') select(card);
    });
    card.addEventListener('pointerleave', deferClose);
    card.addEventListener('focus', () => select(card));
    card.addEventListener('blur', deferClose);
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && active !== card) {
        card.dataset.firstTap = 'true';
        select(card);
      }
    });
    card.addEventListener('click', (e) => {
      if (card.dataset.firstTap) {
        e.preventDefault();
        delete card.dataset.firstTap;
      }
    });
  });
  popup.addEventListener('pointerenter', () => {
    if (leaveTimer) clearTimeout(leaveTimer);
  });
  popup.addEventListener('pointerleave', deferClose);
  popup.addEventListener('focusout', deferClose);
  root.querySelector('[data-popup-close]')?.addEventListener('click', () => {
    select(null);
    pause.focus();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      select(null);
      pause.focus();
    }
  });
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Resume motion' : 'Pause motion';
    pause.setAttribute('aria-pressed', String(paused));
    requestDraw();
  });
  function size() {
    if (!canvas || !ctx) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    if (
      canvas.width !== Math.round(width * ratio) ||
      canvas.height !== Math.round(height * ratio)
    ) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function line(a: Vec, b: Vec, ascent: number, alpha: number, fogged = true) {
    if (!ctx || alpha < 0.002) return;
    const points = projectCurve(a, b, ascent, width, height, currentZoom);
    if (points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      const fog = fogged
        ? sceneryOpacity((a.x + b.x) / 2, (a.z + b.z) / 2, currentView)
        : 1;
      ctx.globalAlpha = alpha * fog;
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
  }
  function draw(now: number) {
    frame = 0;
    if (!root || !canvas || !ctx || !inView || document.hidden) {
      last = 0;
      return;
    }
    if (reduced.matches) {
      root.classList.remove('is-live');
      canvas.hidden = true;
      select(null);
      last = 0;
      pause.disabled = true;
      profileContent.style.opacity = '1';
      profileContent.style.transform = '';
      profileContent.inert = false;
      controls.style.opacity = '1';
      controls.inert = false;
      portrait.style.opacity = '1';
      portrait.style.transform = '';
      portraitOffset = 0;
      return;
    }
    root.classList.add('is-live');
    canvas.hidden = false;
    pause.disabled = false;
    size();
    const progress = clamp(
      -root.getBoundingClientRect().top /
        Math.max(1, root.offsetHeight - innerHeight),
    );
    const ascent = interval(progress, 0.17, 0.42);
    const zoom = interval(progress, 0.4, 0.73);
    const phases = portraitPhases(progress);
    const { shape, formation, settle } = phases;
    const handoff = interval(progress, 0.99, 1);
    currentZoom = zoom;
    currentView = sceneView(progress, world.length);
    const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
    last = now;
    const target = paused
      ? 0
      : active?.matches(':focus-visible')
        ? 0
        : active
          ? 0.06
          : 1;
    speed += (target - speed) * (1 - Math.exp(-dt * 10));
    flight += dt * 24 * speed * (1 - ascent);
    const distance = flight + Math.min(progress, 0.42) * 45;
    controls.style.opacity = String(1 - interval(progress, 0.85, 0.96));
    controls.inert = progress > 0.96;
    profileContent.style.opacity = String(interval(progress, 0.86, 0.96));
    portrait.style.opacity = String(handoff);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b100f';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 0.75;
    const scenery = phases.ground;
    const projection = (p: Vec) =>
      cameraProject(p, ascent, width, height, zoom);
    if (scenery > 0.001) {
      ctx.strokeStyle = '#67877d';
      for (let z = 0; z < world.length; z += 14) {
        const depth = wrapDepth(z, distance, world.length);
        if (depth > currentView.fogEnd) continue;
        for (const [a, b] of groundCrossSections(depth))
          line(a, b, ascent, 0.14 * scenery);
      }
      // Short world-space spans preserve the horizon rolloff and local fog;
      // one enormous edge can skip the bend and draw an angular road seam.
      const groundDepth = Math.min(world.length, currentView.fogEnd);
      for (let x = -408; x <= 408; x += 12)
        for (let z = 2; z < groundDepth; z += 14)
          line(
            { x, y: 0, z },
            { x, y: 0, z: Math.min(z + 14, groundDepth) },
            ascent,
            0.1 * scenery,
          );
      ctx.strokeStyle = '#b8c7b9';
      for (const x of [-6, 6])
        for (let z = 2; z < groundDepth; z += 14)
          line(
            { x, y: 0, z },
            { x, y: 0, z: Math.min(z + 14, groundDepth) },
            ascent,
            0.45 * scenery,
          );
      ctx.strokeStyle = '#d86741';
      for (let z = 0; z < world.length; z += 14) {
        const depth = wrapDepth(z, distance, world.length);
        if (depth < 2) continue;
        if (depth > currentView.fogEnd) continue;
        line(
          { x: 0, y: 0.02, z: depth },
          { x: 0, y: 0.02, z: depth + 5 },
          ascent,
          0.65 * scenery,
        );
      }
    }
    const gridRect = portraitGrid.getBoundingClientRect(),
      profileRect = profile.getBoundingClientRect();
    // Remove the previous frame's visual offset before measuring layout.
    const placement = portraitPlacement(
      profileRect.top,
      gridRect.top - portraitOffset,
    );
    portraitOffset = handoff > 0 ? placement.offset : 0;
    portrait.style.transform = `translateY(${portraitOffset}px)`;
    // Text stays in normal document flow; no scroll-cancelling JS transform.
    profileContent.inert = progress < 0.86;
    const targetTop = placement.top;
    const portraitFade = 1 - handoff;
    // In overhead view greater world Z is higher on screen. Preserve that order
    // so the city does not fold through itself while moving into the portrait.
    const rowRanks = overheadRowRanks(world, distance);
    const candidates = new Map<
      number,
      { matrix: number[]; opacity: number; z: number }
    >();
    // Once the morph is complete, draw the shared paths directly. Rebuilding
    // every roof on scroll here stalls both the text and the document handoff.
    if (formation === 1 && portraitFade > 0) {
      const left =
        ((width - gridRect.width) / 2) * (1 - settle) + gridRect.left * settle;
      const top =
        ((height - gridRect.height) / 2) * (1 - settle) + targetTop * settle;
      ctx.save();
      ctx.translate(left, top);
      ctx.scale(gridRect.width, gridRect.width);
      ctx.strokeStyle = '#ccd6c4';
      ctx.lineWidth = PORTRAIT_STROKE;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = portraitFade;
      ctx.stroke(facePath);
      ctx.restore();
    }
    if (formation < 1)
      for (const b of world.buildings) {
        const z = wrapDepth(b.z, distance, world.length);
        if (ascent < 0.01 && z < 1) continue;
        const center = projection({ x: b.x + b.w / 2, y: b.h, z: z + b.d / 2 });
        if (!center.visible && formation === 0) continue;
        const screenSize =
          (Math.max(width * 0.76, height * 0.85) * b.w) /
          Math.max(1, center.depth);
        const row = Math.floor(b.index / PORTRAIT_COLUMNS),
          col = b.index % PORTRAIT_COLUMNS;
        const faceRow = portraitRowAtRank(rowRanks.get(row) ?? row, world.rows);
        const strokes =
          faceRow === null
            ? undefined
            : portraitCells.get(faceRow * PORTRAIT_COLUMNS + col);
        const maskPresence = strokes ? 1 : 1 - shape;
        const anchor = projection({
          x: b.x + b.w / 2,
          y: Math.min(6, b.h * 0.25),
          z: z + b.d / 2,
        });
        const visibility = buildingOpacity(
          b,
          z,
          ascent,
          anchor,
          width,
          height,
          currentView,
        );
        const objectOpacity = visibility * maskPresence * phases.wire;
        // Cover and facade consume exactly the same opacity in the same frame.
        if (b.billboard !== null && objectOpacity > 0.001) {
          const quad = billboardFace(b, z).map(projection);
          if (quad.every((p) => p.visible))
            candidates.set(b.billboard, {
              matrix: quadMatrix(quad),
              opacity: objectOpacity,
              z,
            });
        }
        if (phases.morph > 0 && strokes) {
          const v = corners(b, z);
          const roof = [4, 5, 6, 7].map((i) => projection(v[i]));
          const centeredLeft = (width - gridRect.width) / 2;
          const centeredTop = (height - gridRect.height) / 2;
          const left = centeredLeft + (gridRect.left - centeredLeft) * settle;
          const top = centeredTop + (targetTop - centeredTop) * settle;
          ctx.strokeStyle = '#ccd6c4';
          ctx.lineWidth =
            0.75 + (gridRect.width * PORTRAIT_STROKE - 0.75) * formation;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha =
            (phases.morph * portraitFade * (0.65 + formation * 0.35)) /
            Math.pow(strokes.length, 1 - formation);
          for (const stroke of strokes) {
            const target = stroke.map((p) => ({
              x: left + p.x * gridRect.width,
              y: top + p.y * gridRect.width,
            }));
            const points = morphRoofToStroke(roof, target, formation);
            ctx.beginPath();
            points.forEach((p, i) =>
              i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
            );
            ctx.stroke();
          }
          ctx.lineWidth = 0.75;
        }
        if (objectOpacity < 0.002) continue;
        const alpha = 0.65 * objectOpacity;
        if (alpha < 0.002) continue;
        const v = corners(b, z);
        ctx.strokeStyle = '#b2c2b4';
        if (screenSize < 13 || zoom > 0.18) {
          // Actual roofs shrink under the ascending camera before reshaping into face contours.
          for (const [a, c] of [
            [4, 5],
            [5, 6],
            [6, 7],
            [7, 4],
          ])
            line(v[a], v[c], ascent, alpha, false);
        } else {
          for (const [a, c] of EDGES) line(v[a], v[c], ascent, alpha, false);
          if (screenSize > 32) {
            ctx.strokeStyle = '#6f9081';
            for (
              let floor = 1;
              floor < b.floors;
              floor += screenSize < 70 ? 2 : 1
            ) {
              const y = (b.h * floor) / b.floors;
              line(
                { x: b.x, y, z },
                { x: b.x + b.w, y, z },
                ascent,
                alpha * 0.45,
                false,
              );
              const x = b.side < 0 ? b.x + b.w : b.x;
              line(
                { x, y, z },
                { x, y, z: z + b.d },
                ascent,
                alpha * 0.4,
                false,
              );
            }
          }
        }
      }
    ctx.globalAlpha = 1;
    let selectedVisible = false;
    cards.forEach((card, index) => {
      const candidate = candidates.get(index);
      const opacity = candidate?.opacity ?? 0;
      const visible = billboardIsVisible(opacity);
      card.classList.toggle('in-view', visible);
      card.style.opacity = String(opacity);
      card.tabIndex = visible ? 0 : -1;
      card.setAttribute('aria-hidden', String(!visible));
      if (candidate) {
        card.style.transform = `matrix3d(${candidate.matrix.join(',')})`;
        card.style.zIndex = String(Math.round(1000 - candidate.z));
      }
      if (active === card && visible) selectedVisible = true;
    });
    if (active && !selectedVisible) select(null);
    if (progress < 0.42 && (!paused || Math.abs(speed - target) > 0.001))
      requestDraw();
  }
  function requestDraw() {
    if (!frame && inView && !document.hidden)
      frame = requestAnimationFrame(draw);
  }
  const observer = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    last = 0;
    if (inView) requestDraw();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  observer.observe(root);
  document.addEventListener('visibilitychange', () => {
    last = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestDraw();
  });
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', requestDraw);
  reduced.addEventListener('change', () => {
    last = 0;
    requestDraw();
  });
  window.addEventListener('pagehide', () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  });
  window.addEventListener('pageshow', () => {
    observer.observe(root);
    last = 0;
    requestDraw();
  });
  void document.fonts.ready.then(requestDraw);
  requestDraw();
  function skipToContent(id: string, updateUrl = false) {
    const target = document.getElementById(id);
    if (!target) return;
    if (updateUrl) history.pushState(null, '', `#${id}`);
    const top =
      scrollY +
      target.getBoundingClientRect().top -
      (id === 'profile' ? 0 : 90);
    window.scrollTo({ top, behavior: 'instant' });
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    requestDraw();
  }
  root
    .querySelectorAll<HTMLAnchorElement>(
      'a[href=\"#profile\"],a[href=\"#city-contents\"]',
    )
    .forEach((link) => {
      link.addEventListener('click', (event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        skipToContent(link.hash.slice(1), true);
      });
    });
  // Account for the pinned height before resolving direct links to ordinary content.
  if (location.hash === '#profile' || location.hash === '#city-contents') {
    requestAnimationFrame(() => skipToContent(location.hash.slice(1)));
  }
}
