import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  sceneView,
  sceneryOpacity,
  buildingOpacity,
  buildWorld,
  wrapDepth,
  cameraProject,
  billboardFace,
  billboardIsVisible,
} from '../src/scene/world.ts';

test('scrolling into ascent opens both distance and lateral visibility smoothly', () => {
  const street = sceneView(0),
    raised = sceneView(0.3),
    above = sceneView(0.43);
  assert.ok(street.fogEnd < raised.fogEnd && raised.fogEnd < above.fogEnd);
  assert.equal(sceneryOpacity(50, 300, street), 0);
  assert.ok(sceneryOpacity(50, 300, raised) > 0.1);
  assert.ok(sceneryOpacity(50, 300, above) > sceneryOpacity(50, 300, raised));
  let previous = 0;
  for (let p = 0; p <= 0.44; p += 0.01) {
    const alpha = sceneryOpacity(50, 300, sceneView(p));
    assert.ok(alpha >= previous - 1e-8);
    previous = alpha;
  }
});
test('tall buildings remain visible above distant street haze while foreground road stays solid', () => {
  const view = sceneView(0);
  assert.equal(sceneryOpacity(12, 210, view, 8), 0);
  assert.ok(sceneryOpacity(12, 210, view, 35) > 0);
  assert.equal(sceneryOpacity(6, 2, view), 1);
  assert.equal(sceneryOpacity(6, 160, view), 0);
  const b = buildWorld(24).buildings.find((b) => b.billboard !== null);
  assert.equal(
    buildingOpacity(b, 5, 0, { x: 600, y: 300 }, 1200, 684, view),
    0,
  );
});
test('the entire street loop always has readable visible adverts despite irregular spacing', () => {
  const world = buildWorld(24),
    signs = world.buildings.filter((b) => b.billboard !== null);
  for (let distance = -52; distance < world.length; distance += 4) {
    const readable = signs.filter((b) => {
      const z = wrapDepth(b.z, distance, world.length);
      const anchor = cameraProject(
        { x: b.x + b.w / 2, y: 6, z: z + b.d / 2 },
        0,
        1200,
        684,
      );
      return (
        buildingOpacity(b, z, 0, anchor, 1200, 684) > 0.12 &&
        billboardFace(b, z).every((p) => cameraProject(p, 0, 1200, 684).visible)
      );
    });
    assert.ok(readable.length >= 1, `no readable billboard at ${distance}`);
  }
  for (const opacity of [0.003, 0.02, 0.05, 0.12, 1])
    assert.equal(billboardIsVisible(opacity), true);
  assert.equal(billboardIsVisible(0), false);
});
test('profile text stays in native document flow and invisible layers do not intercept adverts', async () => {
  const js = await readFile('src/scene/journey.ts', 'utf8');
  assert.ok(!js.includes('profileContent.style.transform = `'));
  const css = await readFile('src/styles/global.css', 'utf8');
  assert.match(css, /\.profile-portrait\s*\{\s*pointer-events: none;/);
  assert.match(css, /\.profile-content\[inert\]\s*\{\s*pointer-events: none;/);
});
