import data from './portrait-data.json' with { type: 'json' };

export type Point = { x: number; y: number };
export const PORTRAIT_COLUMNS = data.columns;
export const PORTRAIT_ROWS = data.rows;
export const PORTRAIT_ASPECT = data.aspect;
export const PORTRAIT_STROKE = data.strokeWidth;
export const portraitPaths: Point[][] = data.paths.map((path) =>
  path.map(([x, y]) => ({ x, y })),
);
export const portraitSvgPaths = portraitPaths.map((path) =>
  path.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(''),
);

// Short connected strokes are assigned to the nearest roof in portrait space.
// Adjacent strokes retain exactly shared endpoints, including closed loops.
export const portraitCells = new Map<number, Point[][]>();
for (const path of portraitPaths) {
  let segment = [path[0]],
    length = 0;
  const store = () => {
    if (segment.length < 2) return;
    const middle = segment[Math.floor(segment.length / 2)];
    const col = Math.min(
      PORTRAIT_COLUMNS - 1,
      Math.floor(middle.x * PORTRAIT_COLUMNS),
    );
    const row = Math.min(
      PORTRAIT_ROWS - 1,
      Math.floor((middle.y / PORTRAIT_ASPECT) * PORTRAIT_ROWS),
    );
    const key = row * PORTRAIT_COLUMNS + col;
    const cell = portraitCells.get(key) ?? [];
    cell.push(segment);
    portraitCells.set(key, cell);
  };
  for (let i = 1; i < path.length; i++) {
    length += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    segment.push(path[i]);
    if (length >= 0.022) {
      store();
      segment = [path[i]];
      length = 0;
    }
  }
  store();
}

/** Pick one roof per portrait row, even as the content-driven city grows. */
export function portraitRowAtRank(
  rank: number,
  cityRows: number,
): number | null {
  if (cityRows < PORTRAIT_ROWS)
    throw new RangeError(
      'The city needs at least as many rows as the portrait',
    );
  if (rank < 0 || rank >= cityRows) return null;
  const row = Math.round((rank * (PORTRAIT_ROWS - 1)) / (cityRows - 1));
  return Math.round((row * (cityRows - 1)) / (PORTRAIT_ROWS - 1)) === rank
    ? row
    : null;
}
function smooth(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
export function portraitPhases(progress: number) {
  const morph = smooth(progress, 0.48, 0.58);
  return {
    shape: smooth(progress, 0.4, 0.59),
    ground: 1 - smooth(progress, 0.4, 0.54),
    wire: 1 - morph,
    morph,
    formation: smooth(progress, 0.48, 0.77),
    settle: smooth(progress, 0.84, 0.96),
  };
}
