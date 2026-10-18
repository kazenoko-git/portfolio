import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portraitPlacement } from '../src/scene/layout.ts';
import { groundCrossSections } from '../src/scene/ground.ts';
import { cameraProject, projectCurve } from '../src/scene/world.ts';

test('the portrait stays level through handoff then scrolls upward without a bounce', () => {
  const positions = [160, 100, 60, 40, 20, 10, 0, -10, -40, -100].map(
    (profileTop) => {
      const natural = Math.max(100, profileTop + 180);
      const { top, offset } = portraitPlacement(profileTop, natural);
      assert.equal(
        top,
        natural + offset,
        'SVG and canvas must use the same position',
      );
      return top;
    },
  );
  assert.deepEqual(positions.slice(0, 7), Array(7).fill(180));
  for (let i = 1; i < positions.length; i++)
    assert.ok(positions[i] <= positions[i - 1]);
});
test('reading a translated portrait does not compound its offset on the next frame', () => {
  let previous = 0;
  for (const profileTop of [60, 40, 20, 0, 20, 40, 60]) {
    const measured = profileTop + 180 + previous;
    const { offset, top } = portraitPlacement(profileTop, measured - previous);
    assert.equal(top, 180);
    previous = offset;
  }
});
test('ground rows cannot bridge behind the lens or cut across the road', () => {
  for (const z of [-12, -2, 0, 1.99])
    assert.deepEqual(groundCrossSections(z), []);
  for (const z of [2, 8, 24, 150])
    for (const [a, b] of groundCrossSections(z)) {
      assert.ok(a.x * b.x > 0);
      assert.ok(Math.min(Math.abs(a.x), Math.abs(b.x)) >= 8);
      assert.ok(Math.abs(a.x - b.x) <= 12);
      const points = projectCurve(a, b, 0, 1200, 684);
      for (const p of points)
        assert.ok(p.visible && Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(cameraProject(a, 0, 1200, 684).visible);
    }
});
