import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesEntry } from '../src/lib/search.ts';
test('search combines all query words with the selected tag, ignoring case and accents', () => {
  const text = 'Neuromorphic NPU Résumé Hardware ASIC';
  assert.ok(matchesEntry(text, ['ASIC', 'Hardware'], 'resume npu', 'asic'));
  assert.ok(!matchesEntry(text, ['ASIC'], 'npu quantum', ''));
  assert.ok(!matchesEntry(text, ['ASIC'], 'npu', 'Software'));
  assert.ok(matchesEntry(text, ['ASIC'], '', ''));
});
