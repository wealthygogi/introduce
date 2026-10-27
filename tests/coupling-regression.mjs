import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

let server;
let browser;
let base;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { host: '127.0.0.1', port: 0, open: false },
  });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function pageFor(t, route, viewport = { width: 1280, height: 900 }, initScript) {
  const context = await browser.newContext({ locale: 'ko-KR', viewport });
  t.after(() => context.close());
  await context.route('https://fonts.googleapis.com/**', request => request.fulfill({ body: '', contentType: 'text/css' }));
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  await page.goto(`${base}${route}`);
  return page;
}

async function mobilePageFor(t, route) {
  const context = await browser.newContext({ locale: 'ko-KR', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  await context.route('https://fonts.googleapis.com/**', request => request.fulfill({ body: '', contentType: 'text/css' }));
  const page = await context.newPage();
  await page.goto(`${base}${route}`);
  return page;
}


const readDraft = (page, key) => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);


test('home routes into coupling hub and retains the introduction-sheet gallery', async t => {
  const page = await pageFor(t, '/');
  await page.locator('a[href="/introduce/coupling"]').first().click();
  await page.waitForURL('**/introduce/coupling');
  assert.equal(await page.locator('.coupling-hub-card').count(), 4);
  assert.equal(await page.locator('.coupling-hub-card a[href^="/introduce/coupling/"]').count(), 4);

  await page.locator('a[href="/introduce/sheets"]').first().click();
  await page.waitForURL('**/introduce/sheets');
  assert.equal(await page.getByRole('heading', { level: 1, name: '나를 소개하는, 나만의 한 장' }).count(), 1);
  assert.equal(await page.locator('.mode-options a[href="/introduce/compact"]').count(), 1);
  assert.equal(await page.locator('.mode-options a[href="/introduce/wide"]').count(), 1);
});


test('whiteboard batch is atomic, edges follow moved nodes, and full layout fits all characters', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.waitForSelector('.coupling-whiteboard');
  assert.equal(await page.locator('.coupling-board-node').count(), 6);

  const additions = await page.evaluate(async () => {
    const { PROFILE_CHARACTERS } = await import('/introduce/src/data/profileCatalog.ts');
    const placed = new Set([...document.querySelectorAll('.coupling-board-node')].map(node => node.dataset.node));
    return ['Embodiment of Scarlet Devil', 'Mountain of Faith'].map(work => {
      const character = PROFILE_CHARACTERS.find(item => item.group.en === work && !placed.has(item.id));
      return { id: character.id, name: character.ko, group: character.group.ko };
    });
  });

  await page.getByRole('button', { name: '캐릭터 추가' }).click();
  const dialog = page.locator('.coupling-batch-dialog');
  const box = await dialog.boundingBox();
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  assert.ok(Math.abs(box.x - (viewport.width - box.width) / 2) < 2, 'desktop batch dialog is horizontally centered');
  assert.ok(Math.abs(box.y - (viewport.height - box.height) / 2) < 2, 'desktop batch dialog is vertically centered');
  for (const addition of additions) {
    await dialog.locator('select').selectOption(addition.group);
    await dialog.locator('.coupling-batch-choice').filter({ hasText: addition.name }).locator('input').check();
  }
  await dialog.getByRole('button', { name: '취소' }).click();
  assert.equal(await page.locator('.coupling-board-node').count(), 6, 'cancel leaves the document unchanged');

  await page.getByRole('button', { name: '캐릭터 추가' }).click();
  for (const addition of additions) {
    await dialog.locator('select').selectOption(addition.group);
    await dialog.locator('.coupling-batch-choice').filter({ hasText: addition.name }).locator('input').check();
  }
  await dialog.locator('.coupling-batch-shell > footer > button:last-child').click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 8);
  for (const addition of additions) assert.equal(await page.locator(`[data-node="${addition.id}"]`).count(), 1);

  const avatar = page.locator('[data-node="reimu"] img');
  await page.waitForFunction(() => document.querySelector('[data-node="reimu"] img')?.naturalWidth > 0);
  assert.ok(await avatar.evaluate(image => image.naturalWidth > 0), 'local portrait image renders');
  await page.locator('[data-node="reimu"] .coupling-node-ring').hover();
  const tooltip = page.locator('#coupling-tip-reimu');
  await tooltip.waitFor({ state: 'visible' });
  assert.match(await tooltip.innerText(), /레이무/);
  const tipBox = await tooltip.boundingBox();
  assert.ok(tipBox.x >= 0 && tipBox.y >= 0 && tipBox.x + tipBox.width <= viewport.width && tipBox.y + tipBox.height <= viewport.height);

  await page.locator('.coupling-whiteboard .coupling-toolbar button:nth-of-type(3)').click();
  const reimuRing = page.locator('[data-node="reimu"] .coupling-node-ring');
  const marisaRing = page.locator('[data-node="marisa"] .coupling-node-ring');
  await reimuRing.click();
  await marisaRing.click();
  const edge = page.locator('.coupling-edge-hit[data-edge]');
  await edge.waitFor({ state: 'attached' });
  const pathBefore = await edge.getAttribute('d');
  assert.match(pathBefore, /^M .* L /, 'a single mutual relation is rendered as a straight path');
  assert.ok(await page.locator('.coupling-board-edges g .coupling-edge-line').first().getAttribute('marker-start'));

  await page.locator('.coupling-whiteboard .coupling-toolbar button:nth-of-type(2)').click();
  await page.locator('.coupling-whiteboard').focus();
  await page.keyboard.press('Escape');
  const ring = page.locator('[data-node="reimu"] .coupling-node-ring');
  const ringBox = await ring.boundingBox();
  const oldPosition = await page.locator('[data-node="reimu"]').evaluate(node => [node.style.left, node.style.top]);
  await page.mouse.move(ringBox.x + ringBox.width / 2, ringBox.y + ringBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(ringBox.x + ringBox.width / 2 + 56, ringBox.y + ringBox.height / 2 + 32, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(previous => document.querySelector('.coupling-edge-hit[data-edge]')?.getAttribute('d') !== previous, pathBefore);
  const newPosition = await page.locator('[data-node="reimu"]').evaluate(node => [node.style.left, node.style.top]);
  assert.notDeepEqual(newPosition, oldPosition);

  await ring.click();
  await page.locator('[data-node="reimu"] .coupling-node-remove').click();
  await page.waitForFunction(() => !document.querySelector('[data-node="reimu"]'));
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 0, 'removing a node removes incident edges');
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('[data-node="reimu"]').count(), 1);
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 1);

  const catalogIds = await page.evaluate(async () => (await import('/introduce/src/data/profileCatalog.ts')).PROFILE_CHARACTERS.map(character => character.id));
  const beforeLayout = await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    view: viewport.querySelector('.coupling-board-world').getAttribute('style'),
    edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => [edge.dataset.edge, edge.getAttribute('d')]),
  }));
  assert.equal(beforeLayout.edges.length, 1);

  const cancelled = page.waitForEvent('dialog');
  const cancelClick = page.getByRole('button', { name: '전체 배치' }).click();
  const cancelDialog = await cancelled;
  assert.match(cancelDialog.message(), /작품별/);
  await cancelDialog.dismiss();
  await cancelClick;
  assert.deepEqual(await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    view: viewport.querySelector('.coupling-board-world').getAttribute('style'),
    edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => [edge.dataset.edge, edge.getAttribute('d')]),
  })), beforeLayout, 'cancelling full layout leaves nodes, edges, and view unchanged');

  const confirmation = page.waitForEvent('dialog');
  const layoutClick = page.getByRole('button', { name: '전체 배치' }).click();
  const nativeDialog = await confirmation;
  await nativeDialog.accept();
  await layoutClick;
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 225);
  const layout = await page.locator('.coupling-board-viewport').evaluate(viewport => {
    const viewportRect = viewport.getBoundingClientRect();
    const nodes = [...viewport.querySelectorAll('.coupling-board-node')].map(node => {
      const rect = node.getBoundingClientRect();
      return { id: node.dataset.node, x: Number.parseFloat(node.style.left), y: Number.parseFloat(node.style.top),
        visible: rect.left >= viewportRect.left - 1 && rect.top >= viewportRect.top - 1 && rect.right <= viewportRect.right + 1 && rect.bottom <= viewportRect.bottom + 1 };
    });
    let minimumDistance = Infinity;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) minimumDistance = Math.min(minimumDistance, Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y));
    return { nodes, minimumDistance, zoom: Number.parseInt(document.querySelector('.coupling-board-zoom output').textContent, 10),
      edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => edge.dataset.edge) };
  });
  assert.equal(new Set(layout.nodes.map(node => node.id)).size, catalogIds.length);
  assert.deepEqual(layout.nodes.map(node => node.id).sort(), catalogIds.sort(), 'full layout contains each catalog ID exactly once');
  assert.ok(layout.minimumDistance >= 76, `full-layout circles do not overlap: minimum center distance ${layout.minimumDistance}`);
  assert.ok(layout.nodes.every(node => node.visible), 'all full-layout nodes fit inside the canvas viewport');
  assert.ok(layout.zoom <= 100, 'full layout zoom stays at or below 100%');
  assert.deepEqual(layout.edges, beforeLayout.edges.map(edge => edge[0]), 'full layout preserves relationships');

  await page.getByRole('button', { name: '실행 취소' }).click();
  await page.waitForFunction(expected => document.querySelectorAll('.coupling-board-node').length === expected, beforeLayout.nodes.length);
  assert.deepEqual(await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    view: viewport.querySelector('.coupling-board-world').getAttribute('style'),
    edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => [edge.dataset.edge, edge.getAttribute('d')]),
  })), beforeLayout, 'one undo restores the prior coordinates, edge geometry, and view');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:whiteboard:v1') ?? '{}').data?.edges?.length === 1);
  const stored = await readDraft(page, 'introduce:coupling:whiteboard:v1');
  assert.equal(stored.version, 1);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:whiteboard:v1']);
});

test('whiteboard batch picker lists only characters with coupling face portraits', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.locator('.coupling-whiteboard .coupling-toolbar button').first().click();
  const dialog = page.locator('.coupling-batch-dialog');
  await dialog.waitFor({ state: 'visible' });
  await dialog.locator('select').selectOption('');
  const faceIds = await page.evaluate(async () => await (await fetch('/introduce/src/features/coupling/portraitIds.json')).json());
  await dialog.locator('input[type="search"]').fill('Alice Margatroid');
  const aliceChoice = dialog.locator('.coupling-batch-choice').filter({ hasText: '앨리스 마가트로이드' });
  assert.equal(await aliceChoice.count(), 1, 'Alice is selectable with her face portrait');
  assert.equal(await aliceChoice.locator('.coupling-avatar').getAttribute('data-portrait-kind'), 'face');
  const aliceImage = aliceChoice.locator('.coupling-avatar img');
  assert.match(await aliceImage.getAttribute('src') ?? '', /\/coupling\/faces\/alice\.png$/);
  await page.waitForFunction(image => image.complete && image.naturalWidth === 512, await aliceImage.elementHandle());
  await dialog.locator('input[type="search"]').fill('');
  const listedIds = await dialog.locator('.coupling-batch-choice img').evaluateAll(images => images.map(image => new URL(image.src).pathname.split('/').pop().replace(/\.png$/, '')));
  assert.deepEqual(listedIds.sort(), [...faceIds].sort());
  await dialog.locator('.coupling-batch-actions button').first().click();
  const starter = ['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko'];
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), faceIds.filter(id => !starter.includes(id)).length, 'select-all excludes portrait-less characters too');
});

test('batch selection preserves the board until confirm and commits as one undo step', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  const toolbar = page.locator('.coupling-whiteboard .coupling-toolbar');
  await toolbar.locator('button:nth-of-type(3)').click();
  await page.locator('[data-node="reimu"] .coupling-node-ring').click();
  await page.locator('[data-node="marisa"] .coupling-node-ring').click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-edge-hit[data-edge]').length === 1);

  for (const id of ['sakuya', 'remilia', 'youmu', 'yuyuko']) {
    const node = page.locator(`[data-node="${id}"]`);
    await node.locator('.coupling-node-ring').hover();
    await node.locator('.coupling-node-remove').click();
    await page.waitForFunction(key => !document.querySelector(`[data-node="${key}"]`), id);
  }
  const before = await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    edge: viewport.querySelector('.coupling-edge-hit[data-edge]')?.getAttribute('d'),
  }));
  assert.deepEqual(before.nodes.map(node => node[0]).sort(), ['marisa', 'reimu']);

  const opener = toolbar.locator('button').first();
  const openDialog = async () => {
    await opener.click();
    const dialog = page.locator('.coupling-batch-dialog');
    await dialog.waitFor({ state: 'visible' });
    return dialog;
  };
  const selectBatch = async dialog => {
    for (const [work, name] of [
      ['동방홍마향', '이자요이 사쿠야'],
      ['동방홍마향', '레밀리아 스칼렛'],
      ['동방요요몽', '콘파쿠 요우무'],
    ]) {
      await dialog.locator('select').selectOption(work);
      await dialog.locator('.coupling-batch-choice').filter({ hasText: name }).locator('input').check();
    }
  };

  await page.locator('.coupling-board-viewport').focus();
  await page.keyboard.press('/');
  const globalDialog = page.locator('.coupling-batch-dialog');
  await globalDialog.waitFor({ state: 'visible' });
  const globalSearch = globalDialog.locator('input[type="search"]');
  assert.equal(await globalSearch.evaluate(element => element === document.activeElement), true, 'the slash shortcut opens global search with focus in the search field');
  await globalSearch.fill('no-results');
  await page.keyboard.press('v');
  assert.equal(await globalSearch.inputValue(), 'no-resultsv', 'typing in search does not trigger whiteboard shortcuts');
  assert.equal(await toolbar.locator('button:nth-of-type(3)').getAttribute('aria-pressed'), 'true', 'typing cannot switch the active tool');
  await page.keyboard.press('Escape');
  await globalDialog.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.coupling-board-viewport').evaluate(element => element === document.activeElement), true, 'closing the global search restores focus to the keyboard shortcut origin');
  const dialog = await openDialog();
  assert.equal(await dialog.locator('footer button.coupling-btn-primary').isDisabled(), true, 'zero selections cannot be confirmed');
  assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'focus starts inside the modal');
  await page.keyboard.press('Shift+Tab');
  assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Shift+Tab stays within the modal');
  await dialog.locator('select').selectOption('동방홍마향');
  await dialog.locator('.coupling-batch-actions button:first-child').click();
  assert.ok(await dialog.locator('.coupling-batch-pending button').count() > 0, 'select-all adds the available characters in the chosen work');
  await dialog.locator('.coupling-batch-actions button:nth-child(2)').click();
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), 0, 'clear-selection empties the pending batch');
  await selectBatch(dialog);
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), 3, 'selection survives changing works');
  await dialog.locator('select').selectOption('');
  assert.equal(await dialog.locator('.coupling-batch-choice').filter({ hasText: '하쿠레이 레이무' }).locator('input').isDisabled(), true, 'placed characters cannot be selected again');
  await dialog.locator('input[type="search"]').fill('no-character-matches-this-query');
  await dialog.locator('.coupling-empty-note').waitFor();
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), 3);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await opener.evaluate(element => element === document.activeElement), true, 'Escape returns focus to the opener');
  assert.deepEqual(await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    edge: viewport.querySelector('.coupling-edge-hit[data-edge]')?.getAttribute('d'),
  })), before, 'Escape discards the pending batch without changing nodes or edges');

  const confirmDialog = await openDialog();
  await selectBatch(confirmDialog);
  await confirmDialog.getByRole('button', { name: '선택한 3명 추가' }).click();
  await confirmDialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 5);
  assert.deepEqual(await page.locator('.coupling-board-node').evaluateAll(nodes => nodes.map(node => node.dataset.node).filter(id => !['reimu', 'marisa'].includes(id)).sort()), ['remilia', 'sakuya', 'youmu']);
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 1, 'the existing edge is preserved');
  assert.deepEqual(await page.locator('[data-node="reimu"],[data-node="marisa"]').evaluateAll(nodes => nodes.map(node => [node.dataset.node, node.style.left, node.style.top])), before.nodes);
  await toolbar.getByRole('button', { name: '실행 취소' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 2);
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 1, 'one undo removes the whole batch');
  await toolbar.getByRole('button', { name: '다시 실행' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 5);
});


test('keyboard relay displays Alice face portrait, not a pixel sprite', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  const search = page.locator('.coupling-keyboard-search input');
  await search.fill('앨리스 마가트로이드');
  const avatar = page.locator('.coupling-keyboard-destinations button')
    .filter({ hasText: '앨리스 마가트로이드' })
    .locator('.coupling-avatar');
  const image = avatar.locator('img');
  await image.waitFor({ state: 'visible' });
  assert.equal(await avatar.getAttribute('data-portrait-kind'), 'face');
  assert.match(await image.getAttribute('src') ?? '', /\/coupling\/faces\/alice\.png$/);
  await page.waitForFunction(image => image.complete && image.naturalWidth === 512, await image.elementHandle());
});

test('keyboard relay handles the 1-1-Enter sequence, reverse updates, and IME events', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  const root = page.locator('.coupling-keyboard');
  await root.focus();
  await root.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: '1', keyCode: 229, bubbles: true, isComposing: true })));
  assert.equal(await root.getAttribute('data-stage'), 'relation', 'IME composition does not advance the relay');
  await page.keyboard.press('1');
  assert.equal(await root.getAttribute('data-stage'), 'target');
  await page.keyboard.press('1');
  assert.equal(await root.getAttribute('data-stage'), 'confirm');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.coupling-keyboard-relation').length === 1);
  const search = page.locator('.coupling-keyboard-search input');
  await search.fill('레이무');
  await search.dispatchEvent('compositionstart');
  const stageBeforeComposition = await root.getAttribute('data-stage');
  await search.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: '1', keyCode: 229, bubbles: true, isComposing: true })));
  assert.equal(await root.getAttribute('data-stage'), stageBeforeComposition, 'search composition cannot advance a relay stage');
  assert.equal(await page.locator('.coupling-keyboard-relation').count(), 1, 'search composition cannot change a relation');
  await search.dispatchEvent('compositionend');
  await search.fill('');

  await page.getByRole('button', { name: '중심 변경' }).click();
  await page.locator('.coupling-keyboard-library [data-character="marisa"]').click();
  await page.locator('.coupling-keyboard-search input').fill('레이무');
  await page.locator('.coupling-keyboard-destinations button').first().click();
  assert.equal(await root.getAttribute('data-stage'), 'confirm');
  await page.keyboard.press('2');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:keyboard:v1') ?? '{}').data?.edges?.[0]?.relation === 'favorite');
  assert.equal(await page.locator('.coupling-keyboard-relation').count(), 1, 'reversing the center updates the existing unordered pair');
  assert.match(await page.locator('.coupling-keyboard-relation').first().innerText(), /최애 커플링/);

  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const stored = await readDraft(page, 'introduce:coupling:keyboard:v1');
  assert.equal(stored.data.edges.length, 1);
  assert.equal(stored.data.edges[0].relation, 'favorite');
  assert.deepEqual(new Set([stored.data.edges[0].a, stored.data.edges[0].b]), new Set(['reimu', 'marisa']));
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:keyboard:v1']);
  await page.reload();
  await page.waitForSelector('.coupling-keyboard-relation');
  assert.equal(await page.locator('.coupling-keyboard-relation').count(), 1);
});


test('pair cards prevent self-pairs, preserve direction and memo, deduplicate, edit, and reorder', async t => {
  const page = await pageFor(t, '/coupling/pairs');
  const pick = async (id) => page.locator(`.coupling-pairs-library [data-character="${id}"]`).click();
  const save = async name => page.getByRole('button', { name }).click();
  const choosePair = async (a, b) => { await pick(a); await pick(b); };
  const count = () => page.locator('.coupling-pair-card').count();

  await choosePair('reimu', 'marisa');
  const slotWidths = await page.locator('.coupling-pairs-slot-wrap').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  assert.equal(slotWidths.length, 2);
  assert.ok(slotWidths.every(width => width >= 200), `both character slots remain usable at desktop width: ${slotWidths.join(', ')}`);
  assert.ok(Math.abs(slotWidths[0] - slotWidths[1]) < 1, 'the A and B character slots have matching widths');
  assert.equal(await page.locator('.coupling-pairs-library [data-character="reimu"]').isDisabled(), true, 'the active pair cannot select the same person twice');
  await page.locator('.coupling-pairs-fields textarea').fill('favorite scene\nfirst note');
  await save('카드 저장');
  assert.equal(await count(), 1);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /레이무.*마리사|레이무[\s\S]*마리사/);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /favorite scene\nfirst note/);

  await save('새 카드');
  await choosePair('reimu', 'marisa');
  await save('카드 저장');
  assert.equal(await count(), 1, 'a duplicate forward card is rejected');
  assert.equal(await page.locator('.coupling-pairs-feedback').getAttribute('data-tone'), 'error');

  await save('새 카드');
  await choosePair('reimu', 'marisa');
  await page.locator('.coupling-pairs-controls label:last-child select').selectOption('reverse');
  await page.locator('.coupling-pairs-fields textarea').fill('reverse direction');
  await save('카드 저장');
  assert.equal(await count(), 2, 'the reciprocal directed relationship is distinct');
  assert.match(await page.locator('.coupling-pair-card').nth(1).locator('.coupling-pair-caption').innerText(), /마리사.*→.*레이무/);

  await save('새 카드');
  await choosePair('sakuya', 'youmu');
  await page.locator('.coupling-pairs-controls label:last-child select').selectOption('mutual');
  await page.locator('.coupling-pairs-fields textarea').fill('mutual note');
  await save('카드 저장');
  assert.equal(await count(), 3);
  await page.locator('.coupling-pair-card').nth(2).getByRole('button', { name: '앞으로 이동' }).click();
  assert.match(await page.locator('.coupling-pair-card').nth(1).locator('.coupling-pair-caption').innerText(), /咲夜|사쿠야/);
  assert.match(await page.locator('.coupling-pair-card').nth(1).locator('.coupling-pair-caption').innerText(), /↔/);

  await page.locator('.coupling-pair-card').first().getByRole('button', { name: '편집' }).click();
  const longMemo = 'unsaved relationship note\n'.repeat(24);
  await page.locator('.coupling-pairs-fields textarea').fill(longMemo);
  await page.waitForFunction(expected => JSON.parse(localStorage.getItem('introduce:coupling:pairs:v1') ?? '{}').data?.draft?.memo === expected, longMemo);
  const editingId = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:coupling:pairs:v1')).data.editingId);
  assert.ok(editingId, 'the unsaved form retains its edit target');

  await page.goto(new URL('/introduce/coupling/keyboard', base).toString());
  await page.waitForSelector('.coupling-keyboard');
  await page.goto(new URL('/introduce/coupling/pairs', base).toString());
  await page.waitForSelector('.coupling-pairs');
  await page.reload();
  await page.waitForSelector('.coupling-pairs');
  assert.equal(await page.locator('.coupling-pairs-fields textarea').inputValue(), longMemo, 'a long multiline memo survives route changes and reload');
  assert.equal(await page.locator('.coupling-pair-card[data-editing="true"]').count(), 1, 'the edit target is restored with the draft');
  assert.equal(await page.getByRole('button', { name: '카드 수정 저장' }).count(), 1);
  await page.locator('.coupling-pairs-fields textarea').fill('edited memo');
  await page.locator('.coupling-pairs-controls label:last-child select').selectOption('mutual');
  await save('카드 수정 저장');
  assert.equal(await count(), 3);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /edited memo/);

  await page.locator('.coupling-pair-card').first().getByRole('button', { name: '삭제' }).click();
  assert.equal(await count(), 2, 'deleting a pair card removes only that card');
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await count(), 3, 'undo restores the deleted pair card');
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /edited memo/);

  await save('새 카드');
  await choosePair('marisa', 'reimu');
  await page.locator('.coupling-pairs-controls label:last-child select').selectOption('mutual');
  await save('카드 저장');
  assert.equal(await count(), 3, 'mutual pairs deduplicate regardless of slot order');
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-pair-card').length === 3);
  assert.equal(await count(), 3);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /edited memo/);
  const stored = await readDraft(page, 'introduce:coupling:pairs:v1');
  assert.equal(stored.data.pairs.length, 3);
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:pairs:v1']);
});


test('matrix keeps directed records independent, unordered records symmetric, and removal undoable', async t => {
  const page = await pageFor(t, '/coupling/matrix');
  const forward = page.locator('button[data-from="reimu"][data-to="marisa"]');
  const reverse = page.locator('button[data-from="marisa"][data-to="reimu"]');
  await forward.click();
  await reverse.click();
  assert.equal(await forward.getAttribute('aria-pressed'), 'true');
  assert.equal(await reverse.getAttribute('aria-pressed'), 'true');
  await page.locator('.coupling-matrix-mode button:nth-child(2)').click();
  await forward.click();
  assert.equal(await forward.getAttribute('aria-pressed'), 'true');
  assert.equal(await reverse.getAttribute('aria-pressed'), 'true', 'an unordered record appears in both mirrored cells');
  await reverse.press('Space');
  assert.equal(await forward.getAttribute('aria-pressed'), 'false', 'space toggles the shared unordered record');
  await forward.click();

  await page.locator('.coupling-matrix-mode button:first-child').click();
  const removal = page.locator('.coupling-matrix-chip').first().locator('button');
  await removal.click();
  assert.equal(await page.locator('.coupling-matrix-confirm').count(), 1);
  await page.locator('.coupling-matrix-confirm button:nth-child(2)').click();
  assert.equal(await page.locator('.coupling-matrix-chip').count(), 6, 'cancel keeps the roster');
  await page.locator('.coupling-matrix-chip').first().locator('button').click();
  await page.locator('.coupling-matrix-confirm button:first-child').click();
  assert.equal(await page.locator('.coupling-matrix-chip').count(), 5);
  assert.equal(await page.locator('.coupling-matrix-cell[data-from="reimu"]').count(), 0);
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.coupling-matrix-chip').count(), 6);
  assert.equal(await page.locator('button[data-from="reimu"][data-to="marisa"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('button[data-from="marisa"][data-to="reimu"]').getAttribute('aria-pressed'), 'true');
  await page.reload();
  assert.equal(await page.locator('.coupling-matrix-mode button:first-child').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.coupling-matrix-mode button:first-child').innerText(), '방향 있음 (2)');
  assert.equal(await page.locator('.coupling-matrix-mode button:nth-child(2)').innerText(), '방향 없음 (1)');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:matrix:v1']);
});



test('mobile touch supports batch selection, ring connections, deletion, and matrix scrolling', async t => {
  const page = await mobilePageFor(t, '/coupling/whiteboard');
  const tap = async locator => {
    const target = typeof locator === 'string' ? page.locator(locator) : locator;
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    assert.ok(box, 'touch target has a visible box');
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  };
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 6);
  const additions = await page.evaluate(async () => {
    const { PROFILE_CHARACTERS } = await import('/introduce/src/data/profileCatalog.ts');
    const placed = new Set([...document.querySelectorAll('.coupling-board-node')].map(node => node.dataset.node));
    const works = new Set();
    return PROFILE_CHARACTERS.filter(character => {
      if (placed.has(character.id) || works.has(character.group.ko)) return false;
      works.add(character.group.ko);
      return true;
    }).slice(0, 2).map(character => ({ id: character.id, name: character.ko, group: character.group.ko }));
  });

  await tap('.coupling-toolbar > button:first-child');
  const dialog = page.locator('.coupling-batch-dialog');
  const dialogBox = await dialog.boundingBox();
  assert.ok(dialogBox && dialogBox.x >= 0 && dialogBox.y >= 0 && dialogBox.x + dialogBox.width <= 390 && dialogBox.y + dialogBox.height <= 844, 'batch dialog fits the mobile viewport');
  for (const addition of additions) {
    await dialog.locator('select').selectOption(addition.group);
    await tap(dialog.locator('.coupling-batch-choice').filter({ hasText: addition.name }));
  }
  assert.deepEqual(await dialog.locator('.coupling-batch-pending button').evaluateAll(buttons => buttons.map(button => button.textContent?.replace(/ ×$/, ''))), additions.map(addition => addition.name), 'pending selection retains one character from each work');
  await tap(dialog.locator('.coupling-batch-shell > footer > button:last-child'));
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 8);

  await tap('.coupling-toolbar > button:nth-child(3)');
  await tap('[data-node="reimu"] .coupling-node-ring');
  await tap('[data-node="marisa"] .coupling-node-ring');
  await page.waitForFunction(() => document.querySelectorAll('.coupling-edge-hit[data-edge]').length === 1);
  await tap('.coupling-toolbar > button:nth-child(2)');
  await tap('[data-node="reimu"] .coupling-node-ring');
  await tap('.coupling-toolbar > button:nth-of-type(6)');
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 7);
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 0, 'removing an endpoint also removes its connection');

  await page.goto(`${base}/coupling/matrix`);
  const matrixScroll = page.locator('.coupling-matrix-scroll');
  await matrixScroll.scrollIntoViewIfNeeded();
  const dimensions = await matrixScroll.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth }));
  assert.ok(dimensions.scrollWidth > dimensions.width, 'the matrix has content beyond the mobile viewport');
  const box = await matrixScroll.boundingBox();
  assert.ok(box);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width - 12, y: box.y + box.height / 2, id: 1 }] });
  await page.waitForTimeout(40);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 30, y: box.y + box.height / 2, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => document.querySelector('.coupling-matrix-scroll')?.scrollLeft > 0);
  assert.ok(await matrixScroll.evaluate(element => element.scrollLeft > 0), 'a touch drag scrolls the matrix internally');
  await cdp.detach();
});
test('matrix roster caps at sixteen and reports the blocked addition', async t => {
  const page = await pageFor(t, '/coupling/matrix');
  const additions = await page.evaluate(async () => {
    const { PROFILE_CHARACTERS } = await import('/introduce/src/data/profileCatalog.ts');
    const starter = new Set(['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko']);
    return PROFILE_CHARACTERS.filter(character => !starter.has(character.id)).slice(0, 11).map(character => character.id);
  });
  await page.locator('.coupling-matrix-library summary').click();
  for (const id of additions) await page.locator(`.coupling-matrix-library [data-character="${id}"]`).click();
  assert.equal(await page.locator('.coupling-matrix-chip').count(), 16);
  assert.match(await page.locator('.coupling-matrix-note').innerText(), /최대 16명/);
  assert.match(await page.locator('.coupling-matrix-help .coupling-status').innerText(), /최대 16명/);
});


test('malformed drafts remain untouched until edit, pagehide flushes, and blocked storage stays usable', async t => {
  const malformed = await pageFor(t, '/coupling/keyboard', { width: 1280, height: 900 }, () => {
    localStorage.setItem('introduce:coupling:keyboard:v1', '{broken');
  });
  await malformed.waitForSelector('.coupling-keyboard');
  assert.match(await malformed.locator('.coupling-keyboard-session').innerText(), /저장된 초안을 복원하지 못했습니다/);
  assert.equal(await malformed.evaluate(() => localStorage.getItem('introduce:coupling:keyboard:v1')), '{broken');
  await malformed.locator('.coupling-keyboard').focus();
  await malformed.keyboard.press('1');
  await malformed.keyboard.press('1');
  await malformed.keyboard.press('Enter');
  await malformed.waitForSelector('.coupling-keyboard-relation');
  await malformed.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const repaired = await readDraft(malformed, 'introduce:coupling:keyboard:v1');
  assert.equal(repaired.version, 1);
  assert.equal(repaired.data.edges.length, 1);

  const blocked = await pageFor(t, '/coupling/pairs', { width: 1280, height: 900 }, () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('introduce:coupling:')) throw new DOMException('blocked', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await blocked.locator('.coupling-pairs-library [data-character="reimu"]').click();
  await blocked.locator('.coupling-pairs-library [data-character="marisa"]').click();
  await blocked.getByRole('button', { name: '카드 저장' }).click();
  await blocked.waitForFunction(() => document.querySelector('.coupling-pairs-save-state')?.textContent === '현재 탭에서만 유지');
  assert.equal(await blocked.locator('.coupling-pair-card').count(), 1, 'editing remains available without localStorage writes');
  assert.match(await blocked.locator('.coupling-pairs-feedback').innerText(), /자동 저장할 수 없습니다/);
  assert.equal(await blocked.evaluate(() => localStorage.getItem('introduce:coupling:pairs:v1')), null);
});


test('all editors fit narrow viewports and the batch dialog stays on screen', async t => {
  const page = await pageFor(t, '/coupling/whiteboard', { width: 320, height: 800 });
  const routes = [
    ['/coupling/whiteboard', '.coupling-whiteboard'],
    ['/coupling/keyboard', '.coupling-keyboard'],
    ['/coupling/pairs', '.coupling-pairs'],
    ['/coupling/matrix', '.coupling-matrix-editor'],
  ];
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const [route, selector] of routes) {
      await page.goto(`${base}${route}`);
      await page.waitForSelector(selector);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
      assert.ok(dimensions.document <= dimensions.width, `${route} overflows horizontally at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(`${base}/coupling/whiteboard`);
  await page.waitForSelector('.coupling-whiteboard');
  await page.getByRole('button', { name: '캐릭터 추가' }).click();
  const bounds = await page.locator('.coupling-batch-dialog').boundingBox();
  assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 320 && bounds.y + bounds.height <= 844);
  await page.locator('.coupling-batch-dialog').getByRole('button', { name: '취소' }).click();

  await page.goto(`${base}/coupling/matrix`);
  await page.waitForSelector('.coupling-matrix-scroll');
  const table = await page.locator('.coupling-matrix-scroll').evaluate(element => ({ width: element.clientWidth, content: element.scrollWidth }));
  assert.ok(table.content > table.width, 'the matrix scrolls internally instead of widening the page');
});
