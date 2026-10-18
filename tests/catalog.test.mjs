import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cityCatalog } from '../src/lib/catalog.ts';
const entry = (collection, id, data = {}) => ({
  collection,
  id,
  data: {
    title: id,
    summary: 'A description.',
    date: new Date('2026-10-17'),
    ...data,
  },
});
test('new entries appear automatically without featured flags or duplicated metadata', () => {
  const entries = [
    entry('projects', 'new-project'),
    entry('papers', 'new-paper'),
    entry('certifications', 'new-credential'),
    entry('writing', 'new-post', { draft: false }),
  ];
  assert.equal(cityCatalog(entries).length, 4);
  assert.equal(
    cityCatalog(entries).find((e) => e.id === 'new-paper'),
    entries[1],
  );
});
test('drafts and explicit city opt-outs are excluded, with stable priority and date ordering', () => {
  const entries = [
    entry('writing', 'draft', { draft: true }),
    entry('projects', 'hidden', { city: false }),
    entry('papers', 'old', { date: new Date('2020-01-01') }),
    entry('projects', 'new'),
    entry('projects', 'priority', { featuredOrder: 1 }),
  ];
  assert.deepEqual(
    cityCatalog(entries).map((e) => e.id),
    ['priority', 'new', 'old'],
  );
});
