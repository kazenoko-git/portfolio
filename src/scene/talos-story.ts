const captions = [
  'Input bits travel from the host to Talos over SPI.',
  'Sixteen signed 8-bit values hold the network’s current state.',
  'Feedback reads a frozen snapshot of the previous step’s spikes.',
  'One arithmetic unit visits neurons 0–15. Scroll moves the orange outline.',
  'The host reads the completed state and makes the final prediction.',
];

export function startTalosStory() {
  const match = document.querySelector<HTMLElement>('[data-talos-story]');
  if (!match) return;
  const root: HTMLElement = match;
  const steps = [
    ...root.querySelectorAll<HTMLElement>('[data-architecture-step]'),
  ];
  const neurons = [...root.querySelectorAll<SVGGElement>('[data-neuron]')];
  const blocks = [...root.querySelectorAll<SVGGElement>('[data-block]')];
  const cursor = root.querySelector<SVGGElement>('[data-scan-cursor]')!;
  const signal = root.querySelector<SVGPathElement>('[data-input-signal]')!;
  const feedback = root.querySelector<SVGGElement>('[data-recurrence]')!;
  const caption = root.querySelector<HTMLElement>('[data-diagram-caption]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let active = -1;
  function draw() {
    frame = 0;
    const narrow = matchMedia('(max-width: 700px)').matches;
    // On phones the sticky diagram sits above the text; track the paragraph below it.
    const readingLine = narrow
      ? Math.min(innerHeight - 90, 370)
      : innerHeight * 0.48;
    let index = 0;
    steps.forEach((step, i) => {
      if (step.getBoundingClientRect().top <= readingLine) index = i;
    });
    const rect = steps[index].getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(1, (readingLine - rect.top) / Math.max(1, rect.height)),
    );
    if (index !== active) {
      active = index;
      root.dataset.stage = String(index);
      blocks.forEach((block) =>
        block.classList.toggle(
          'is-active',
          Number(block.dataset.block) === index,
        ),
      );
      feedback.classList.toggle('is-active', index === 2);
      caption.textContent = captions[index];
    }
    const neuron = Math.min(15, Math.floor(progress * 16));
    neurons.forEach((node) =>
      node.classList.toggle(
        'is-active',
        index === 1 || (index === 3 && Number(node.dataset.neuron) === neuron),
      ),
    );
    cursor.style.display = index !== 3 || reduced.matches ? 'none' : '';
    cursor.setAttribute(
      'transform',
      `translate(${(neuron % 4) * 49} ${Math.floor(neuron / 4) * 46})`,
    );
    signal.style.strokeDashoffset = String(
      reduced.matches ? 0 : 100 - progress * 100,
    );
    signal.style.opacity = index === 0 ? '1' : '0';
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  reduced.addEventListener('change', schedule);
  draw();
}
