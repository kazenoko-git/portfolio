import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  portraitPhases,
  portraitPaths,
  portraitCells,
  PORTRAIT_COLUMNS,
  PORTRAIT_ROWS,
  PORTRAIT_ASPECT,
  portraitRowAtRank,
} from '../src/scene/portrait.ts';
import { morphRoofToStroke } from '../src/scene/portrait-renderer.ts';
import { buildWorld } from '../src/scene/world.ts';

test('roofs become connected face lines before the portrait settles', () => {
  const start = portraitPhases(0.48),
    face = portraitPhases(0.8);
  assert.equal(start.formation, 0);
  assert.equal(start.morph, 0);
  assert.equal(face.shape, 1);
  assert.equal(face.ground, 0);
  assert.equal(face.wire, 0);
  assert.equal(face.morph, 1);
  assert.equal(face.formation, 1);
  assert.equal(face.settle, 0);
  assert.equal(portraitPhases(0.97).settle, 1);
  assert.ok(!('dots' in face) && !('letters' in face));
});
test('all original contour edges appear exactly once in the roof targets', () => {
  assert.ok(portraitPaths.length > 100);
  const length = (path) =>
    path
      .slice(1)
      .reduce(
        (sum, p, i) => sum + Math.hypot(p.x - path[i].x, p.y - path[i].y),
        0,
      );
  const source = portraitPaths.reduce((sum, path) => sum + length(path), 0);
  const targets = [...portraitCells.values()].flat();
  const traced = targets.reduce((sum, path) => sum + length(path), 0);
  assert.ok(Math.abs(source - traced) < 1e-8);
  for (const [key, paths] of portraitCells) {
    assert.ok(key >= 0 && key < PORTRAIT_COLUMNS * PORTRAIT_ROWS);
    for (const path of paths)
      for (const p of path)
        assert.ok(
          Number.isFinite(p.x) &&
            p.x >= 0 &&
            p.x <= 1 &&
            p.y >= 0 &&
            p.y <= PORTRAIT_ASPECT,
        );
  }
});
test('every contour row has exactly one source roof row as the city grows', () => {
  for (const items of [0, 24, 51, 100]) {
    const { rows } = buildWorld(items);
    const mapped = Array.from({ length: rows }, (_, rank) =>
      portraitRowAtRank(rank, rows),
    ).filter((row) => row !== null);
    assert.deepEqual(
      mapped,
      Array.from({ length: PORTRAIT_ROWS }, (_, row) => row),
    );
  }
});
test('roof interpolation retains its corners and reaches exact connected line endpoints', () => {
  const roof = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  const stroke = [
    { x: 30, y: 20 },
    { x: 35, y: 25 },
    { x: 40, y: 20 },
  ];
  const start = morphRoofToStroke(roof, stroke, 0);
  for (const p of roof)
    assert.ok(start.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-8));
  const end = morphRoofToStroke(roof, stroke, 1);
  for (const p of stroke)
    assert.ok(end.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 1e-8));
  assert.deepEqual(end[0], stroke[0]);
  assert.deepEqual(end.at(-1), stroke.at(-1));
  const next = morphRoofToStroke(roof, [stroke.at(-1), { x: 50, y: 30 }], 1);
  assert.deepEqual(end.at(-1), next[0]);
  for (const progress of [0.1, 0.5, 0.9])
    for (const p of morphRoofToStroke(roof, stroke, progress))
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
});
