import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test('IndexedDB image assets can be saved, read, listed, and deleted', async () => {
  const page = await browser.newPage();
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const { createTasteBoardImageStorage } = await import('/introduce/src/features/characters/tasteBoardImageStorage.ts');
    const storage = createTasteBoardImageStorage(indexedDB, 'taste-board-image-test');
    const image = new Blob(['sample image data'], { type: 'image/png' });
    await storage.put('image-one', image);
    const read = await storage.get('image-one');
    const listed = await storage.listIds();
    await storage.delete('image-one');
    return { type: read?.type, size: read?.size, listed, deleted: await storage.get('image-one') };
  });
  assert.deepEqual(result, { type: 'image/png', size: 17, listed: ['image-one'], deleted: null });
  await page.close();
});

test('pruning retains an in-flight asset until its board reference is saved', async () => {
  const page = await browser.newPage();
  await page.goto(base);
  const ids = await page.evaluate(async () => {
    const { createTasteBoardImageStorage } = await import('/introduce/src/features/characters/tasteBoardImageStorage.ts');
    const storage = createTasteBoardImageStorage(indexedDB, 'taste-board-image-prune-test');
    await storage.put('pending-image', new Blob(['image'], { type: 'image/png' }));
    storage.protect('pending-image');
    await storage.prune(new Set());
    const whilePending = await storage.listIds();
    storage.unprotect('pending-image');
    await storage.prune(new Set());
    return { whilePending, afterSave: await storage.listIds() };
  });
  assert.deepEqual(ids, { whilePending: ['pending-image'], afterSave: [] });
  await page.close();
});
