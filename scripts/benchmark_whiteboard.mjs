import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Keep the original expression as the comparison baseline.
const original = "new Set(edges.filter(edge=>edge.direction==='forward'&&edges.some(other=>other.id!==edge.id&&other.from===edge.to&&other.to===edge.from&&other.direction==='forward')).map(edge=>edge.id))";
const { stripTypeScriptTypes } = await import('node:module');
const optimized = stripTypeScriptTypes(await readFile(new URL('../src/features/coupling/curvedEdges.ts', import.meta.url), 'utf8')).replace('export ', '');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const results = await page.evaluate(({ original, optimized }) => {
    return ['original', 'optimized'].flatMap(implementation => {
    const calculate = implementation === 'original' ? new Function('edges', `return ${original}`) : new Function(`${optimized}; return getCurvedEdgeIds;`)();
    return [100, 500, 1000].flatMap(count => ['one-way', 'reciprocal'].map(shape => {
      const edges = Array.from({ length: count }, (_, i) => {
        const reverse = shape === 'reciprocal' && i % 2 === 1;
        const pair = shape === 'reciprocal' ? Math.floor(i / 2) : i;
        return { id: `edge-${i}`, from: `node-${pair * 2 + (reverse ? 1 : 0)}`, to: `node-${pair * 2 + (reverse ? 0 : 1)}`, direction: 'forward' };
      });
      for (let i = 0; i < 50; i++) calculate(edges);
      const samples = Array.from({ length: 200 }, () => {
        const start = performance.now();
        for (let i = 0; i < 5; i++) calculate(edges);
        return (performance.now() - start) / 5;
      }).sort((a, b) => a - b);
      return { implementation, count, shape, medianMs: samples[100], p95Ms: samples[189] };
    }));
    });
  }, { original, optimized });
  console.log(JSON.stringify({ browser: await browser.version(), results }, null, 2));
} finally { await browser.close(); }
