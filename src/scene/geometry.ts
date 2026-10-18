export const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));
export function interval(value: number, start: number, end: number) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
export function silhouette(x: number, y: number) {
  const head = (x / 0.28) ** 2 + ((y + 0.27) / 0.39) ** 2 < 1;
  const shoulder = (x / 0.66) ** 2 + ((y - 0.65) / 0.52) ** 2 < 1;
  const neck = Math.abs(x) < 0.13 && y > 0.03 && y < 0.37;
  return head || shoulder || neck;
}
