import type { Point } from './portrait';

/** Interpolate entire roof edges into connected contour strokes. Include both
 * sets of corners so neither endpoint loses geometry during resampling. */
export function morphRoofToStroke(
  roof: Point[],
  stroke: Point[],
  amount: number,
): Point[] {
  const source = [...roof, roof[0]];
  const lengths = (points: Point[]) => {
    const result = [0];
    for (let i = 1; i < points.length; i++)
      result.push(
        result[i - 1] +
          Math.hypot(
            points[i].x - points[i - 1].x,
            points[i].y - points[i - 1].y,
          ),
      );
    const total = result.at(-1) || 1;
    return result.map((v) => v / total);
  };
  const a = lengths(source),
    b = lengths(stroke);
  const sample = (points: Point[], ts: number[], t: number) => {
    let i = 1;
    while (i < ts.length - 1 && ts[i] < t) i++;
    const f = (t - ts[i - 1]) / (ts[i] - ts[i - 1] || 1);
    return {
      x: points[i - 1].x + (points[i].x - points[i - 1].x) * f,
      y: points[i - 1].y + (points[i].y - points[i - 1].y) * f,
    };
  };
  return [...new Set([...a, ...b])]
    .sort((x, y) => x - y)
    .map((t) => {
      const p = sample(source, a, t),
        q = sample(stroke, b, t);
      return { x: p.x + (q.x - p.x) * amount, y: p.y + (q.y - p.y) * amount };
    });
}
