import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

// Trace the supplied light contour artwork into centerlines. No raster asset is
// changed: these paths drive both the roof morph and the accessible SVG.
const source = 'public/images/portrait.png';
const { data, info } = await sharp(source)
  .rotate()
  .resize({ width: 320 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: w, height: h, channels } = info;
const pixels = new Uint8Array(w * h);
for (let i = 0; i < pixels.length; i++) {
  const j = i * channels;
  pixels[i] =
    ((data[j] + data[j + 1] + data[j + 2]) / 765) * (data[j + 3] / 255) > 0.22
      ? 1
      : 0;
}
// Zhang–Suen thinning preserves branches, open strokes, and closed glasses.
let changed = true;
while (changed) {
  changed = false;
  for (let pass = 0; pass < 2; pass++) {
    const remove = [];
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!pixels[i]) continue;
        const p = [-w, -w + 1, 1, w + 1, w, w - 1, -1, -w - 1].map(
          (d) => pixels[i + d],
        );
        const count = p.reduce((a, b) => a + b, 0);
        const transitions = p.reduce(
          (n, v, k) => n + (v === 0 && p[(k + 1) % 8] === 1 ? 1 : 0),
          0,
        );
        if (count < 2 || count > 6 || transitions !== 1) continue;
        if (
          pass === 0
            ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6]
            : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]
        )
          continue;
        remove.push(i);
      }
    for (const i of remove) pixels[i] = 0;
    changed ||= remove.length > 0;
  }
}
const graph = new Map();
for (let i = 0; i < pixels.length; i++)
  if (pixels[i]) {
    const x = i % w,
      y = Math.floor(i / w),
      neighbors = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (
          (!dx && !dy) ||
          x + dx < 0 ||
          x + dx >= w ||
          y + dy < 0 ||
          y + dy >= h
        )
          continue;
        const j = i + dy * w + dx;
        // Do not make triangular junctions through redundant diagonal neighbors.
        if (pixels[j] && !(dx && dy && (pixels[i + dx] || pixels[i + dy * w])))
          neighbors.push(j);
      }
    graph.set(i, neighbors);
  }
const visited = new Set(),
  paths = [];
const key = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
function trace(start, next) {
  const ids = [start];
  let prev = start,
    cur = next;
  while (true) {
    visited.add(key(prev, cur));
    ids.push(cur);
    const neighbors = graph.get(cur);
    if (neighbors.length !== 2 || cur === start) break;
    const n = neighbors.find((n) => n !== prev);
    if (visited.has(key(cur, n))) break;
    prev = cur;
    cur = n;
  }
  if (ids.length < 3) return;
  paths.push(
    ids.map((i) => [
      Number((((i % w) + 0.5) / w).toFixed(6)),
      Number(((Math.floor(i / w) + 0.5) / w).toFixed(6)),
    ]),
  );
}
for (const [i, ns] of graph)
  if (ns.length !== 2)
    for (const n of ns) if (!visited.has(key(i, n))) trace(i, n);
for (const [i, ns] of graph)
  for (const n of ns) if (!visited.has(key(i, n))) trace(i, n);
// Remove the raster staircase while keeping shared junction endpoints fixed.
// Closed contours keep a single shared endpoint throughout both passes.
const smoothPaths = paths.map((path) => {
  const closed = path[0][0] === path.at(-1)[0] && path[0][1] === path.at(-1)[1];
  let points = closed ? path.slice(0, -1) : path;
  for (let pass = 0; pass < 2; pass++) {
    points = points.map((p, i) => {
      if (!closed && (i === 0 || i === points.length - 1)) return p;
      const before = points[(i + points.length - 1) % points.length];
      const after = points[(i + 1) % points.length];
      return p.map((v, axis) =>
        Number(((before[axis] + v * 2 + after[axis]) / 4).toFixed(6)),
      );
    });
  }
  return closed ? [...points, points[0]] : points;
});
await writeFile(
  'src/scene/portrait-data.json',
  JSON.stringify({
    source,
    columns: 64,
    rows: 64,
    aspect: h / w,
    strokeWidth: 0.003,
    paths: smoothPaths,
  }) + '\n',
);
console.log(`Portrait: ${paths.length} contour paths traced from ${source}`);
