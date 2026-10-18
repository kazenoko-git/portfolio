import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorld,
  billboardFace,
  cameraProject,
  projectCurve,
  quadMatrix,
  buildingOpacity,
  overheadRowRanks,
  wrapDepth,
} from '../src/scene/world.ts';
test('every catalog item receives a deterministic building and signs occupy both sides', () => {
  const world = buildWorld(51);
  assert.deepEqual(world, buildWorld(51));
  const signs = world.buildings.filter((b) => b.billboard !== null);
  assert.deepEqual(
    signs.map((b) => b.billboard).sort((a, b) => a - b),
    Array.from({ length: 51 }, (_, i) => i),
  );
  assert.ok(signs.some((b) => b.side < 0) && signs.some((b) => b.side > 0));
});
test('billboards attach to the road-facing wall in the lower part of tall buildings', () => {
  for (const b of buildWorld(4).buildings.filter((b) => b.billboard !== null)) {
    const face = billboardFace(b, b.z);
    const inner = b.side < 0 ? b.x + b.w : b.x;
    for (const p of face) {
      assert.ok(Math.abs(p.x - inner) < 0.04);
      assert.ok(p.z > b.z && p.z < b.z + b.d);
      assert.ok(p.y > 0 && p.y < b.h * 0.4);
    }
    assert.ok(face[0].y > face[3].y);
  }
});
test('billboards have irregular gaps and never form opposing pairs', () => {
  const signs = buildWorld(24)
    .buildings.filter((b) => b.billboard !== null)
    .sort((a, b) => a.z - b.z);
  assert.equal(new Set(signs.map((b) => b.z)).size, signs.length);
  const gaps = signs.slice(1).map((b, i) => b.z - signs[i].z);
  assert.ok(new Set(gaps).size >= 3);
  assert.notDeepEqual(buildWorld(24), buildWorld(24, 81));
});
test('camera stays centered and road edges are mirror symmetric during ascent', () => {
  for (const ascent of [0, 0.25, 0.7, 1])
    for (const z of [8, 30, 100, 300]) {
      const center = cameraProject({ x: 0, y: 0, z }, ascent, 1200, 684);
      const left = cameraProject({ x: -6, y: 0, z }, ascent, 1200, 684);
      const right = cameraProject({ x: 6, y: 0, z }, ascent, 1200, 684);
      assert.equal(center.x, 600);
      assert.ok(Math.abs(left.x + right.x - 1200) < 1e-8);
      assert.ok(Math.abs(left.y - right.y) < 1e-8);
    }
});
test('fisheye draws curved road edges and curved building uprights', () => {
  const cases = [
    [-6, 0, 2, -6, 0, 240],
    [6, 0, 2, 6, 0, 240],
    [12, 0, 12, 12, 30, 12],
  ];
  for (const [x, y, z, X, Y, Z] of cases) {
    const p = projectCurve({ x, y, z }, { x: X, y: Y, z: Z }, 0, 1200, 684);
    assert.ok(p.length > 3);
    const A = p[0],
      B = p.at(-1);
    const deviation = Math.max(
      ...p.map(
        (M) =>
          Math.abs(
            (B.y - A.y) * M.x - (B.x - A.x) * M.y + B.x * A.y - B.y * A.x,
          ) / Math.hypot(B.x - A.x, B.y - A.y),
      ),
    );
    assert.ok(
      deviation > 8,
      `Expected visible curvature, measured ${deviation}px`,
    );
  }
});
test('projective cover transform matches all four wall corners', () => {
  const b = buildWorld(3).buildings.find((b) => b.billboard === 1);
  const quad = billboardFace(b, 24).map((p) => cameraProject(p, 0, 1200, 684));
  const m = quadMatrix(quad);
  [
    [0, 0],
    [280, 0],
    [280, 350],
    [0, 350],
  ].forEach(([x, y], i) => {
    const w = m[3] * x + m[7] * y + m[15];
    assert.ok(Math.abs((m[0] * x + m[4] * y + m[12]) / w - quad[i].x) < 1e-7);
    assert.ok(Math.abs((m[1] * x + m[5] * y + m[13]) / w - quad[i].y) < 1e-7);
  });
});
test('projection stays finite and reversible through the camera ascent', () => {
  for (const a of [0, 0.1, 0.3, 0.5, 0.8, 1])
    for (const width of [390, 1200]) {
      const p = { x: 12, y: 22, z: 40 };
      const projected = cameraProject(p, a, width, 844);
      assert.ok(Number.isFinite(projected.x) && Number.isFinite(projected.y));
      assert.deepEqual(projected, cameraProject(p, a, width, 844));
    }
  const near = cameraProject({ x: 0, y: 0, z: 100 }, 0, 1200, 684);
  const far = cameraProject({ x: 0, y: 0, z: 400 }, 0, 1200, 684);
  assert.ok(
    far.y > near.y,
    'the distant road rolls downward instead of ending on a flat edge',
  );
});
test('one fade controls building and cover at distance, near the lens, and at screen edges', () => {
  const b = buildWorld(3).buildings.find((b) => b.billboard === 0);
  const alpha = (z, x = 600, building = b) =>
    buildingOpacity(building, z, 0, { x, y: 300 }, 1200, 684);
  assert.ok(alpha(90) > 0);
  assert.equal(alpha(300), 0);
  assert.ok(alpha(200) < alpha(60) * 0.25);
  assert.equal(alpha(480), 0);
  assert.equal(alpha(5), 0);
  const edge = [180, 90, 20, -10, -30].map((x) => alpha(60, x));
  for (let i = 1; i < edge.length; i++) assert.ok(edge[i] < edge[i - 1]);
  assert.equal(edge.at(-1), 0);
  assert.ok(alpha(60, 600, { ...b, x: -150 }) < alpha(60) * 0.05);
  assert.equal(
    buildingOpacity(b, 60, 1, { x: -30, y: 300 }, 1200, 684),
    0,
    'edge fading also applies during ascent',
  );
});
test('zoom reveals a large neighborhood then shrinks its buildings into a dot-sized field', () => {
  const world = buildWorld(3);
  assert.ok(world.buildings.length >= 3000);
  const b = world.buildings.find((b) => b.billboard === 0);
  const near = cameraProject({ x: b.x, y: b.h, z: 55 }, 1, 1200, 684, 0);
  const far = cameraProject({ x: b.x, y: b.h, z: 55 }, 1, 1200, 684, 1);
  const nearNext = cameraProject(
    { x: b.x + b.w, y: b.h, z: 55 },
    1,
    1200,
    684,
    0,
  );
  const farNext = cameraProject(
    { x: b.x + b.w, y: b.h, z: 55 },
    1,
    1200,
    684,
    1,
  );
  assert.ok(Math.abs(farNext.x - far.x) < 4);
  assert.ok(Math.abs(nearNext.x - near.x) > Math.abs(farNext.x - far.x) * 10);
});

test('the shrinking city preserves row order throughout the portrait morph', () => {
  const world = buildWorld(3),
    distance = 27,
    ranks = overheadRowRanks(world, distance);
  const rows = world.buildings
    .filter((b) => b.index % 64 === 32)
    .map((b) => ({
      row: Math.floor(b.index / 64),
      source: cameraProject(
        { x: b.x, y: b.h, z: wrapDepth(b.z, distance, world.length) },
        1,
        1200,
        684,
        1,
      ).y,
    }))
    .sort((a, b) => a.source - b.source);
  for (const morph of [0, 0.25, 0.5, 0.75, 1]) {
    const ys = rows.map(
      (r) => r.source * (1 - morph) + ranks.get(r.row) * 10 * morph,
    );
    for (let i = 1; i < ys.length; i++)
      assert.ok(
        ys[i] > ys[i - 1],
        'portrait rows must not fold through each other',
      );
  }
});
