import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

test('curved edges match reciprocal forward relations including duplicate ids and self loops', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: { server: createHttpServer() } }, appType: 'custom' });
  try {
    const { getCurvedEdgeIds } = await server.ssrLoadModule('/src/features/coupling/curvedEdges.ts');
    const edges = [
      { id: 'a', from: '1', to: '2', direction: 'forward' },
      { id: 'b', from: '2', to: '1', direction: 'forward' },
      { id: 'c', from: '2', to: '3', direction: 'forward' },
      { id: 'd', from: '3', to: '2', direction: 'both' },
      { id: 'e', from: '4', to: '5', direction: 'forward' },
      { id: 'e', from: '5', to: '4', direction: 'forward' },
      { id: 'f', from: '6', to: '6', direction: 'forward' },
    ];
    const reference = items => new Set(items.filter(edge => edge.direction === 'forward' && items.some(other => other.id !== edge.id && other.from === edge.to && other.to === edge.from && other.direction === 'forward')).map(edge => edge.id));
    assert.deepEqual(getCurvedEdgeIds(edges), reference(edges));
    assert.deepEqual(getCurvedEdgeIds([]), new Set());
    for (let size = 1; size <= 100; size++) {
      const mixed = Array.from({ length: size }, (_, i) => ({ id: String(i), from: String(i % 7), to: String((i * 3) % 7), direction: i % 3 ? 'forward' : 'both' }));
      assert.deepEqual(getCurvedEdgeIds(mixed), reference(mixed));
    }
  } finally { await server.close(); }
});
