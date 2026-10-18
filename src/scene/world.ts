export interface Vec {
  x: number;
  y: number;
  z: number;
}
export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  side: number;
  floors: number;
  index: number;
  billboard: number | null;
}
export const WORLD_SEED = 73;
export const CITY_COLUMNS = 64;
export function buildWorld(itemCount: number, seed = WORLD_SEED) {
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  const rows = Math.max(64, Math.ceil(itemCount * 1.8) + 4);
  // Shuffle bounded gaps around the loop: irregular spacing without stretches
  // longer than the fog's readable window. One sign per row avoids pairs.
  const signs = new Map<number, { side: number; item: number }>();
  if (itemCount > 0) {
    const base = Math.floor(rows / itemCount);
    const extra = rows % itemCount;
    const gaps = Array.from(
      { length: itemCount },
      (_, i) => base + (i < extra ? 1 : 0),
    );
    if (gaps.length >= 3 && gaps[0] > 1) {
      gaps[0]--;
      gaps[1]++;
    }
    for (let i = gaps.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [gaps[i], gaps[j]] = [gaps[j], gaps[i]];
    }
    let row = Math.floor(random() * base);
    for (let item = 0; item < itemCount; item++) {
      signs.set(row % rows, { side: random() < 0.5 ? -1 : 1, item });
      row += gaps[item];
    }
  }
  const buildings: Building[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < CITY_COLUMNS; col++) {
      const side = col < 32 ? -1 : 1;
      const w = 4 + random() * 4,
        d = 7 + random() * 3;
      const inner = col === 31 || col === 32;
      const sign = signs.get(row);
      const billboard = inner && sign?.side === side ? sign.item : null;
      const h = billboard !== null ? 23 + random() * 10 : 7 + random() * 28;
      const x =
        side < 0
          ? -8 - w - (31 - col) * 12 - random() * 2
          : 8 + (col - 32) * 12 + random() * 2;
      buildings.push({
        index: buildings.length,
        side,
        x,
        z: row * 14 + 8,
        w,
        d,
        h,
        floors: Math.floor(h / 2.8),
        billboard,
      });
    }
  return { buildings, length: rows * 14, rows };
}
export function wrapDepth(z: number, distance: number, length: number) {
  return ((((z - distance + 12) % length) + length) % length) - 12;
}
export function cameraProject(
  point: Vec,
  ascent: number,
  width: number,
  height: number,
  zoom = 0,
) {
  const pitch = 0.12 + ascent * (Math.PI / 2 - 0.12);
  const cameraY = 4.2 + ascent * 82 + zoom * 1850;
  const drop =
    ((Math.max(0, point.z - 45) ** 2 + point.x ** 2 * 0.65) / 1100) *
    (1 - ascent) ** 2;
  const y = point.y - drop - cameraY;
  const forward = point.z - ascent * 55 - zoom * 270;
  const horizontal = point.x;
  const z = forward;
  const depth = -y * Math.sin(pitch) + z * Math.cos(pitch);
  const vertical = y * Math.cos(pitch) + z * Math.sin(pitch);
  const f = Math.max(width * 0.76, height * 0.85);
  const nx = horizontal / Math.max(1, depth),
    ny = vertical / Math.max(1, depth);
  // A centered equidistant fisheye: the road center stays on the optical axis,
  // while matching points on either side receive symmetric lens curvature.
  const radius = Math.hypot(nx, ny);
  const lens =
    radius > 0
      ? ((1 - ascent) * Math.atan(radius * 1.75)) / (1.75 * radius) + ascent
      : 1;
  return {
    x: width / 2 + nx * f * lens,
    y: height * (0.48 + (1 - ascent) * 0.15) - ny * f * lens,
    visible: depth > 1.2,
    depth,
    range: Math.hypot(point.x, point.z),
  };
}
export function corners(b: Building, z: number): Vec[] {
  return [
    { x: b.x, y: 0, z },
    { x: b.x + b.w, y: 0, z },
    { x: b.x + b.w, y: 0, z: z + b.d },
    { x: b.x, y: 0, z: z + b.d },
    { x: b.x, y: b.h, z },
    { x: b.x + b.w, y: b.h, z },
    { x: b.x + b.w, y: b.h, z: z + b.d },
    { x: b.x, y: b.h, z: z + b.d },
  ];
}
export const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

export type ScreenPoint = ReturnType<typeof cameraProject>;
/** Project the whole edge, not just its endpoints: straight world lines become lens curves. */
export function projectCurve(
  a: Vec,
  b: Vec,
  ascent: number,
  width: number,
  height: number,
  zoom = 0,
) {
  let A = cameraProject(a, ascent, width, height, zoom),
    B = cameraProject(b, ascent, width, height, zoom);
  if (!A.visible && !B.visible) return [];
  const mix = (p: Vec, q: Vec, t: number): Vec => ({
    x: p.x + (q.x - p.x) * t,
    y: p.y + (q.y - p.y) * t,
    z: p.z + (q.z - p.z) * t,
  });
  if (!A.visible) {
    a = mix(a, b, (1.21 - A.depth) / (B.depth - A.depth));
    A = cameraProject(a, ascent, width, height, zoom);
  }
  if (!B.visible) {
    b = mix(b, a, (1.21 - B.depth) / (A.depth - B.depth));
    B = cameraProject(b, ascent, width, height, zoom);
  }
  const result: ScreenPoint[] = [A];
  function split(
    p: Vec,
    q: Vec,
    P: ScreenPoint,
    Q: ScreenPoint,
    level: number,
  ) {
    const m = mix(p, q, P.depth / (P.depth + Q.depth)),
      M = cameraProject(m, ascent, width, height, zoom);
    const dx = Q.x - P.x,
      dy = Q.y - P.y,
      length = Math.hypot(dx, dy);
    const error = length
      ? Math.abs(dy * M.x - dx * M.y + Q.x * P.y - Q.y * P.x) / length
      : 0;
    if (level < 7 && error > 0.45) {
      split(p, m, P, M, level + 1);
      split(m, q, M, Q, level + 1);
    } else result.push(Q);
  }
  split(a, b, A, B, 0);
  return result;
}
/** Quad corners in reading order: top-left, top-right, bottom-right, bottom-left. */
export function billboardFace(b: Building, z: number): Vec[] {
  const x = b.side < 0 ? b.x + b.w + 0.035 : b.x - 0.035;
  const near = z + 0.45,
    far = z + b.d - 0.45;
  const top = Math.min(b.h * 0.37, 9),
    bottom = Math.max(1.8, top - 6.5);
  const left = b.side < 0 ? near : far,
    right = b.side < 0 ? far : near;
  return [
    { x, y: top, z: left },
    { x, y: top, z: right },
    { x, y: bottom, z: right },
    { x, y: bottom, z: left },
  ];
}
/** Project a flat DOM cover onto all four corners of the road-facing wall. */
export function quadMatrix(
  points: Pick<ScreenPoint, 'x' | 'y'>[],
  width = 280,
  height = 350,
): number[] {
  const [p0, p1, p2, p3] = points;
  const dx1 = p1.x - p2.x,
    dx2 = p3.x - p2.x,
    dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y,
    dy2 = p3.y - p2.y,
    dy3 = p0.y - p1.y + p2.y - p3.y;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = Math.abs(det) > 1e-9 ? (dx3 * dy2 - dx2 * dy3) / det : 0;
  const h = Math.abs(det) > 1e-9 ? (dx1 * dy3 - dx3 * dy1) / det : 0;
  return [
    (p1.x - p0.x + g * p1.x) / width,
    (p1.y - p0.y + g * p1.y) / width,
    0,
    g / width,
    (p3.x - p0.x + h * p3.x) / height,
    (p3.y - p0.y + h * p3.y) / height,
    0,
    h / height,
    0,
    0,
    1,
    0,
    p0.x,
    p0.y,
    0,
    1,
  ];
}

export function overheadRowRanks(
  world: ReturnType<typeof buildWorld>,
  distance: number,
) {
  return new Map(
    world.buildings
      .filter((b) => b.index % CITY_COLUMNS === 0)
      .map((b) => ({
        row: Math.floor(b.index / CITY_COLUMNS),
        z: wrapDepth(b.z, distance, world.length),
      }))
      .sort((a, b) => b.z - a.z)
      .map((r, rank) => [r.row, rank]),
  );
}

function smooth(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}
/** The street-level fog opens into a neighborhood view as scrolling raises
 * the camera, before the portrait mask starts removing the background. */
export function sceneView(progress: number, worldLength = 896) {
  const reveal = smooth(progress, 0.17, 0.43);
  const far = Math.hypot(410, worldLength) * 1.1;
  return {
    fogStart: 45 + (far * 0.6 - 45) * reveal,
    fogEnd: 155 + (far - 155) * reveal,
    lateralReach: 25 + 375 * reveal,
    nearReveal: reveal,
  };
}
export type SceneView = ReturnType<typeof sceneView>;
/** The ground and its buildings use the same scroll-controlled visibility. */
export function sceneryOpacity(
  x: number,
  z: number,
  view = sceneView(0),
  height = 0,
) {
  const range = Math.hypot(x, z);
  const outer = Math.exp(-Math.max(0, Math.abs(x) - 20) / view.lateralReach);
  // Tall facades project above street haze and remain visible farther away.
  const heightReach = height * (1 - view.nearReveal);
  const fog =
    (1 -
      smooth(
        range,
        view.fogStart + heightReach * 0.8,
        view.fogEnd + heightReach * 3,
      )) **
    2;
  return fog * outer;
}
/** Visible adverts stay interactive for their entire visible lifetime. */
export function billboardIsVisible(opacity: number) {
  return opacity > 0.002;
}

/** One object opacity, shared by every building edge and its attached cover. */
export function buildingOpacity(
  b: Building,
  z: number,
  ascent: number,
  anchor: Pick<ScreenPoint, 'x' | 'y'>,
  width: number,
  height: number,
  view = sceneView(ascent * 0.43),
) {
  const edge = Math.min(
    anchor.x,
    width - anchor.x,
    anchor.y - 45,
    height - anchor.y - 35,
  );
  const edgeFade = smooth(edge, -30, Math.min(width * 0.14, 150));
  const near = smooth(z, 5, 24) * (1 - view.nearReveal) + view.nearReveal;
  return (
    sceneryOpacity(b.x + b.w / 2, z + b.d / 2, view, b.h) * near * edgeFade
  );
}
