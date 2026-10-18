import type { Vec } from './world';

/** Small ground spans stay on one side of the lens near plane. Keep the road
 * clear of the transverse grid so its bowed foreground rows cannot look like
 * a second road edge. */
export function groundCrossSections(depth: number): [Vec, Vec][] {
  if (depth < 2) return [];
  const spans: [Vec, Vec][] = [];
  for (const side of [-1, 1])
    for (let x = 8; x < 410; x += 12)
      spans.push([
        { x: side * x, y: 0, z: depth },
        { x: side * Math.min(x + 12, 410), y: 0, z: depth },
      ]);
  return spans;
}
