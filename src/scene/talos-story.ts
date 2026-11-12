type Chapter = {
  at: number;
  title: string;
  description: string;
};

const chapters: Chapter[] = [
  {
    at: 0,
    title: 'An event enters the circuit',
    description:
      'Eight external bits can directly nudge neurons 0–7. Here, scroll is the clock: the input packet moves only when you move.',
  },
  {
    at: 0.2,
    title: 'One unit visits sixteen neurons',
    description:
      'A sequencer shares one LIF arithmetic unit across all 16 states. Each update reads the previous step’s frozen spike vector.',
  },
  {
    at: 0.44,
    title: 'The network becomes a measured trace',
    description:
      'The simulation’s impulse-decay values fall from 21 to 7. Integer right shifts leave a flat residue instead of smooth decay.',
  },
  {
    at: 0.69,
    title: 'A host reads the changing state',
    description:
      'A separate Python readout reached R² 0.945 on a repeated waveform. That is one simulation result, not a chip speed test.',
  },
  {
    at: 0.86,
    title: 'A score still has boundaries',
    description:
      'Talos 1 has no measured silicon result or demonstrated speed or energy advantage over competent host software.',
  },
];

const decay = [21, 19, 17, 15, 14, 13, 12, 11, 10, 9, 8, 7, 7, 7, 7, 7];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const between = (value: number, start: number, end: number) =>
  smooth((value - start) / (end - start));

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function startTalosStory() {
  const rootMatch = document.querySelector<HTMLElement>('[data-talos-story]');
  if (!rootMatch) return;
  const root: HTMLElement = rootMatch;
  const canvasMatch = root.querySelector<HTMLCanvasElement>(
    '[data-talos-canvas]',
  );
  if (!canvasMatch) return;
  const canvas: HTMLCanvasElement = canvasMatch;
  const contextMatch = canvas.getContext('2d');
  if (!contextMatch) return;
  const ctx: CanvasRenderingContext2D = contextMatch;

  const title = root.querySelector<HTMLElement>('[data-story-title]')!;
  const description = root.querySelector<HTMLElement>(
    '[data-story-description]',
  )!;
  const step = root.querySelector<HTMLElement>('[data-story-step]')!;
  const hint = root.querySelector<HTMLElement>('[data-story-hint]')!;
  const progressBar = root.querySelector<HTMLProgressElement>(
    '[data-story-progress]',
  )!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let frame = 0;
  let inView = true;
  let lastChapter = -1;

  function size() {
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

  function chapterAt(progress: number) {
    let index = 0;
    chapters.forEach((chapter, i) => {
      if (progress >= chapter.at) index = i;
    });
    return index;
  }

  function draw() {
    frame = 0;
    if (!inView || document.hidden || reduced.matches) return;
    if (!width || !height) size();
    const progress = clamp(
      -root.getBoundingClientRect().top /
        Math.max(1, root.offsetHeight - window.innerHeight),
    );
    const chapterIndex = chapterAt(progress);
    if (chapterIndex !== lastChapter) {
      const chapter = chapters[chapterIndex];
      title.textContent = chapter.title;
      description.textContent = chapter.description;
      step.textContent = `${String(chapterIndex + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
      hint.textContent =
        chapterIndex === chapters.length - 1
          ? 'The caveats travel with the score ↑'
          : 'Scroll to move through the signal path ↓';
      lastChapter = chapterIndex;
    }
    progressBar.value = progress * 100;

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b100f';
    ctx.fillRect(0, 0, width, height);
    const ascent = between(progress, 0.08, 0.48);
    const horizon = height * (0.46 + ascent * 0.12);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#273530';
    ctx.globalAlpha = 0.68;
    for (let i = 0; i <= 12; i++) {
      const x = (width * i) / 12;
      ctx.beginPath();
      ctx.moveTo(width / 2 + (x - width / 2) * 0.08, horizon);
      ctx.lineTo(x, height);
      ctx.stroke();
      const t = i / 12;
      const y = horizon + (height - horizon) * t * t;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const compact = between(progress, 0.69, 0.84);
    const chipWidth = Math.min(width * 0.72, 700) * (1 - compact * 0.31);
    const chipHeight = Math.min(height * 0.43, 340) * (1 - compact * 0.08);
    const chipX = width * (0.5 - (chipWidth / width) / 2 - compact * 0.13);
    const chipY = height * (0.54 - chipHeight / height / 2);
    const morph = between(progress, 0.42, 0.68);
    const readout = between(progress, 0.68, 0.84);
    const evidence = between(progress, 0.85, 0.94);
    const scan = clamp((progress - 0.2) / 0.24);
    const activeNeuron = progress >= 0.2 && progress < 0.45
      ? Math.min(15, Math.floor(scan * 16))
      : -1;

    const matrix = Array.from({ length: 16 }, (_, i) => ({
      x: chipX + chipWidth * (0.22 + (i % 4) * 0.19),
      y: chipY + chipHeight * (0.24 + Math.floor(i / 4) * 0.18),
    }));
    const plotLeft = chipX + chipWidth * 0.12;
    const plotWidth = chipWidth * 0.76;
    const plotTop = chipY + chipHeight * 0.2;
    const plotHeight = chipHeight * 0.58;
    const plotted = decay.map((value, i) => ({
      x: plotLeft + (plotWidth * i) / (decay.length - 1),
      y: plotTop + ((21 - value) / 21) * plotHeight,
    }));
    const points = matrix.map((point, i) => ({
      x: point.x + (plotted[i].x - point.x) * morph,
      y: point.y + (plotted[i].y - point.y) * morph,
    }));

    ctx.globalAlpha = 1 - compact * 0.36;
    roundRect(ctx, chipX, chipY, chipWidth, chipHeight, 18);
    ctx.fillStyle = '#101a17';
    ctx.fill();
    ctx.strokeStyle = '#799083';
    ctx.lineWidth = 2;
    ctx.stroke();

    // The shared update path is a ring plus fixed longer connections.
    ctx.strokeStyle = '#52675d';
    ctx.lineWidth = 1;
    ctx.globalAlpha = (1 - morph) * 0.74;
    for (let i = 0; i < 16; i++) {
      for (const next of [(i + 1) % 16, (i + 5) % 16]) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[next].x, points[next].y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    points.forEach((point, i) => {
      const pulse = i === activeNeuron ? 1 : 0;
      const radius = Math.max(3.5, Math.min(10, width * 0.012)) + pulse * 2.5;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = i === activeNeuron ? '#e87950' : '#aabdaf';
      ctx.fill();
      ctx.strokeStyle = '#0b100f';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // A signal packet crosses the eight external-input lines before the ALU scan.
    const inputProgress = clamp(progress / 0.2);
    const inputX = width * 0.09 + inputProgress * (chipX - width * 0.1);
    ctx.globalAlpha = 1 - morph;
    ctx.strokeStyle = '#d86741';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width * 0.08, chipY + chipHeight * 0.5);
    ctx.lineTo(chipX, chipY + chipHeight * 0.5);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const y = chipY + chipHeight * (0.27 + i * 0.065);
      ctx.globalAlpha = 0.3 + (i < 3 ? inputProgress * 0.7 : 0);
      ctx.fillStyle = i < 3 ? '#e87950' : '#6e8277';
      ctx.fillRect(width * 0.035, y - 3, width * 0.035, 6);
    }
    ctx.globalAlpha = 1 - morph;
    ctx.beginPath();
    ctx.arc(inputX, chipY + chipHeight * 0.5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f08b63';
    ctx.fill();

    // One LIF arithmetic block is shared; the orange scan cursor follows its turn.
    const aluWidth = Math.min(chipWidth * 0.52, 220);
    const aluX = chipX + (chipWidth - aluWidth) / 2;
    const aluY = chipY + chipHeight * 0.82;
    ctx.globalAlpha = (1 - morph) * 0.95;
    roundRect(ctx, aluX, aluY, aluWidth, Math.max(25, chipHeight * 0.11), 5);
    ctx.fillStyle = '#1d2925';
    ctx.fill();
    ctx.strokeStyle = '#d86741';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const labelSize = Math.max(9, Math.min(13, width * 0.018));
    ctx.fillStyle = '#e7e8dc';
    ctx.font = `bold ${labelSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('ONE SHARED LIF UNIT', aluX + aluWidth / 2, aluY + Math.max(16, chipHeight * 0.075));
    if (activeNeuron >= 0) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#e87950';
      ctx.fillText(`UPDATE ${activeNeuron + 1} / 16`, chipX + chipWidth - 12, chipY + chipHeight - 12);
    }

    // The sixteen neuron marks reshape into the recorded 16-step decay trace.
    if (morph > 0) {
      ctx.globalAlpha = morph;
      ctx.strokeStyle = '#d86741';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const revealedPoints = Math.max(2, Math.ceil(decay.length * morph));
      points.slice(0, revealedPoints).forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#c6d0c2';
      ctx.font = `${labelSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText('21', points[0].x, points[0].y - 12);
      ctx.fillText('7  /  INTEGER FLOOR', points[15].x - 110, points[15].y - 12);
      ctx.globalAlpha = 1;
    }

    // The graph hands its state to a separate host-side readout.
    if (readout > 0) {
      const cardX = width * 0.57;
      const cardY = height * 0.42;
      const cardW = Math.min(width * 0.34, 250);
      const cardH = Math.min(height * 0.2, 150);
      ctx.globalAlpha = readout;
      ctx.strokeStyle = '#d86741';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[15].x, points[15].y);
      ctx.lineTo(cardX, cardY + cardH * 0.5);
      ctx.stroke();
      roundRect(ctx, cardX, cardY, cardW, cardH, 10);
      ctx.fillStyle = '#17221e';
      ctx.fill();
      ctx.strokeStyle = '#81988a';
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#c6d0c2';
      ctx.font = `${labelSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText('HOST READOUT / SIMULATION', cardX + 12, cardY + 22);
      ctx.fillStyle = '#f08b63';
      ctx.font = `bold ${Math.max(21, Math.min(36, width * 0.05))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText('0.945', cardX + 12, cardY + cardH * 0.68);
      ctx.fillStyle = '#e7e8dc';
      ctx.font = `bold ${labelSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText('R² / REPEATED WAVEFORM', cardX + 12, cardY + cardH - 15);
      ctx.globalAlpha = 1;
    }

    if (evidence > 0) {
      ctx.globalAlpha = evidence;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f08b63';
      ctx.font = `bold ${labelSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText('RTL SIMULATION  /  NO SILICON MEASUREMENT', width / 2, height * 0.86);
      ctx.globalAlpha = 1;
    }
  }

  function requestDraw() {
    if (!frame && inView && !document.hidden && !reduced.matches)
      frame = requestAnimationFrame(draw);
  }

  function setMotionMode() {
    if (reduced.matches) {
      root.classList.remove('is-live');
      root.classList.add('is-static');
      canvas.hidden = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      return;
    }
    root.classList.remove('is-static');
    root.classList.add('is-live');
    canvas.hidden = false;
    size();
    requestDraw();
  }

  const observer = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? false;
    if (inView) requestDraw();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  observer.observe(root);
  window.addEventListener('scroll', requestDraw, { passive: true });
  window.addEventListener('resize', () => {
    size();
    requestDraw();
  });
  document.addEventListener('visibilitychange', requestDraw);
  window.addEventListener('pagehide', () => observer.disconnect());
  window.addEventListener('pageshow', () => {
    observer.observe(root);
    requestDraw();
  });
  reduced.addEventListener('change', setMotionMode);
  setMotionMode();
}
