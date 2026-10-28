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
async function chooseBatchWork(dialog, workName) {
  await dialog.getByRole('button', { name: '작품 선택' }).click();
  await dialog.getByRole('searchbox', { name: '작품 검색' }).fill(workName);
  await dialog.getByRole('button', { name: workName, exact: true }).click();
}

async function clickAtCenter(page, target) {
  await target.evaluate(element => {
    const body = element.closest('.coupling-board-panel-body');
    if (!body) return;
    const targetBounds = element.getBoundingClientRect();
    const bodyBounds = body.getBoundingClientRect();
    if (targetBounds.top < bodyBounds.top) body.scrollTop -= bodyBounds.top - targetBounds.top;
    else if (targetBounds.bottom > bodyBounds.bottom) body.scrollTop += targetBounds.bottom - bodyBounds.bottom;
  });
  const box = await target.boundingBox();
  assert.ok(box, 'pointer target has a visible box');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
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
  const boardBounds = await page.locator('.coupling-board-viewport').boundingBox();
  const controlsBounds = await page.locator('.coupling-board-controls').boundingBox();
  const addBounds = await page.locator('.coupling-board-add').boundingBox();
  assert.ok(controlsBounds && controlsBounds.width <= 520 && controlsBounds.height <= 64, 'the floating tool menu stays compact on desktop');
  const insideBoard = bounds => bounds && bounds.x >= boardBounds.x && bounds.y >= boardBounds.y && bounds.x + bounds.width <= boardBounds.x + boardBounds.width && bounds.y + bounds.height <= boardBounds.y + boardBounds.height;
  assert.ok(boardBounds && insideBoard(controlsBounds) && insideBoard(addBounds), 'toolbar and add action stay inside the board viewport');

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
  assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width && box.y + box.height <= viewport.height, 'batch dialog fits the viewport');
  for (const addition of additions) {
    await chooseBatchWork(dialog, addition.group);
    await dialog.locator('.coupling-batch-choice').filter({ hasText: addition.name }).locator('input').check();
  }
  await dialog.getByRole('button', { name: '취소' }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.coupling-board-node').count(), 6, 'cancel leaves the document unchanged');

  await page.getByRole('button', { name: '캐릭터 추가' }).click();
  for (const addition of additions) {
    await chooseBatchWork(dialog, addition.group);
    await dialog.locator('.coupling-batch-choice').filter({ hasText: addition.name }).locator('input').check();
  }
  await dialog.locator('.coupling-btn-primary').click();
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

  await page.locator('.coupling-board-line-toggle').click();
  const coupleRelation = page.getByRole('button', { name: '관계: 커플링' });
  await clickAtCenter(page, coupleRelation);
  assert.equal(await coupleRelation.getAttribute('aria-pressed'), 'true');
  await clickAtCenter(page, page.locator('.coupling-board-preference [data-preference="favorite"]'));
  await page.locator('.coupling-board-line-toggle').click();
  await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').click();
  const reimuRing = page.locator('[data-node="reimu"] .coupling-node-ring');
  const marisaRing = page.locator('[data-node="marisa"] .coupling-node-ring');
  await reimuRing.click();
  await marisaRing.click();
  const edge = page.locator('.coupling-edge-hit[data-edge]');
  await edge.waitFor({ state: 'attached' });
  const pathBefore = await edge.getAttribute('d');
  assert.match(pathBefore, /^M .* L /, 'a single mutual relation is rendered as a straight path');
  assert.ok(await page.locator('.coupling-board-edges g .coupling-edge-line').first().getAttribute('marker-start'));
  assert.equal(await page.locator('.coupling-edge-preference').textContent(), '✦', 'favorite preference is shown separately from relationship type');
  assert.match(await page.locator('.coupling-edge-list').innerText(), /커플링[\s\S]*최애/);

  await page.locator('.coupling-board-tool[data-toolbar-item="move"]').click();
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
  await page.locator('.coupling-board-undo').click();
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
  await page.locator('.coupling-board-more-toggle').click();
  const cancelClick = page.locator('.coupling-board-more-panel').getByRole('button', { name: '전체 배치' }).click();
  const cancelDialog = await cancelled;
  assert.match(cancelDialog.message(), /작품별/);
  await cancelDialog.dismiss();
  await cancelClick;
  assert.deepEqual(await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    view: viewport.querySelector('.coupling-board-world').getAttribute('style'),
    edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => [edge.dataset.edge, edge.getAttribute('d')]),
  })), beforeLayout, 'cancelling full layout leaves nodes, edges, and view unchanged');
  await page.locator('.coupling-board-more-toggle').click();

  const confirmation = page.waitForEvent('dialog');
  const layoutClick = page.locator('.coupling-board-more-panel').getByRole('button', { name: '전체 배치' }).click();
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
    return { nodes, minimumDistance, zoom: Number.parseInt(document.querySelector('.coupling-board-zoom').textContent, 10),
      edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => edge.dataset.edge) };
  });
  assert.equal(new Set(layout.nodes.map(node => node.id)).size, catalogIds.length);
  assert.deepEqual(layout.nodes.map(node => node.id).sort(), catalogIds.sort(), 'full layout contains each catalog ID exactly once');
  assert.ok(layout.minimumDistance >= 76, `full-layout circles do not overlap: minimum center distance ${layout.minimumDistance}`);
  assert.ok(layout.nodes.every(node => node.visible), 'all full-layout nodes fit inside the canvas viewport');
  assert.ok(layout.zoom <= 100, 'full layout zoom stays at or below 100%');
  assert.deepEqual(layout.edges, beforeLayout.edges.map(edge => edge[0]), 'full layout preserves relationships');

  await page.locator('.coupling-board-undo').click();
  await page.waitForFunction(expected => document.querySelectorAll('.coupling-board-node').length === expected, beforeLayout.nodes.length);
  assert.deepEqual(await page.locator('.coupling-board-viewport').evaluate(viewport => ({
    nodes: [...viewport.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
    view: viewport.querySelector('.coupling-board-world').getAttribute('style'),
    edges: [...viewport.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => [edge.dataset.edge, edge.getAttribute('d')]),
  })), beforeLayout, 'one undo restores the prior coordinates, edge geometry, and view');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:whiteboard:v1') ?? '{}').data?.edges?.length === 1);
  const stored = await readDraft(page, 'introduce:coupling:whiteboard:v1');
  assert.equal(stored.version, 1);
  assert.equal(stored.data.edges[0].type, 'love');
  assert.equal(stored.data.edges[0].preference, 'favorite');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:whiteboard:v1']);
});

test('whiteboard batch picker lists only characters with coupling face portraits', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.locator('.coupling-board-add').click();
  const dialog = page.locator('.coupling-batch-dialog');
  await dialog.waitFor({ state: 'visible' });
  const controlTops = await dialog.evaluate(element => ({
    work: element.querySelector('.coupling-batch-work-select > button').getBoundingClientRect().top,
    search: element.querySelector('.coupling-batch-field input').getBoundingClientRect().top,
  }));
  assert.ok(Math.abs(controlTops.work - controlTops.search) < 1,
    `desktop work and search controls share a top edge: ${controlTops.work}, ${controlTops.search}`);
  await chooseBatchWork(dialog, '전체 작품');
  const faceIds = await page.evaluate(async () => await (await fetch('/introduce/src/features/coupling/portraitIds.json')).json());
  await dialog.getByRole('searchbox', { name: '이름 검색' }).fill('Alice Margatroid');
  const aliceChoice = dialog.locator('.coupling-batch-choice').filter({ hasText: '앨리스 마가트로이드' });
  assert.equal(await aliceChoice.count(), 1, 'Alice is selectable with her face portrait');
  assert.equal(await aliceChoice.locator('.coupling-avatar').getAttribute('data-portrait-kind'), 'face');
  const aliceImage = aliceChoice.locator('.coupling-avatar img');
  assert.match(await aliceImage.getAttribute('src') ?? '', /\/coupling\/faces\/alice\.png$/);
  await page.waitForFunction(image => image.complete && image.naturalWidth === 512, await aliceImage.elementHandle());
  await dialog.getByRole('searchbox', { name: '이름 검색' }).fill('');
  const listedIds = await dialog.locator('.coupling-batch-choice img').evaluateAll(images => images.map(image => new URL(image.src).pathname.split('/').pop().replace(/\.png$/, '')));
  assert.deepEqual(listedIds.sort(), [...faceIds].sort());
  await dialog.locator('.coupling-batch-actions button').first().click();
  const starter = ['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko'];
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), faceIds.filter(id => !starter.includes(id)).length, 'select-all excludes portrait-less characters too');
});

test('batch selection preserves the board until confirm and commits as one undo step', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').click();
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

  const opener = page.locator('.coupling-board-add');
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
      await chooseBatchWork(dialog, work);
      await dialog.locator('.coupling-batch-choice').filter({ hasText: name }).locator('input').check();
    }
  };

  await page.locator('.coupling-board-viewport').focus();
  await page.keyboard.press('/');
  const globalDialog = page.locator('.coupling-batch-dialog');
  await globalDialog.waitFor({ state: 'visible' });
  const globalSearch = globalDialog.getByRole('searchbox', { name: '이름 검색' });
  assert.equal(await globalSearch.evaluate(element => element === document.activeElement), true, 'the slash shortcut opens global search with focus in the search field');
  await globalSearch.fill('no-results');
  await page.keyboard.press('v');
  assert.equal(await globalSearch.inputValue(), 'no-resultsv', 'typing in search does not trigger whiteboard shortcuts');
  assert.equal(await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').getAttribute('aria-pressed'), 'true', 'typing cannot switch the active tool');
  await page.keyboard.press('Escape');
  await globalDialog.waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.coupling-board-viewport').evaluate(element => element === document.activeElement), true, 'closing the global search restores focus to the keyboard shortcut origin');
  const dialog = await openDialog();
  assert.equal(await dialog.locator('footer button.coupling-btn-primary').isDisabled(), true, 'zero selections cannot be confirmed');
  assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'focus starts inside the modal');
  await page.keyboard.press('Shift+Tab');
  assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Shift+Tab stays within the modal');
  await chooseBatchWork(dialog, '동방홍마향');
  await dialog.locator('.coupling-batch-actions button:first-child').click();
  assert.ok(await dialog.locator('.coupling-batch-pending button').count() > 0, 'select-all adds the available characters in the chosen work');
  await dialog.locator('.coupling-batch-actions button:nth-child(2)').click();
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), 0, 'clear-selection empties the pending batch');
  await selectBatch(dialog);
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), 3, 'selection survives changing works');
  await chooseBatchWork(dialog, '전체 작품');
  assert.equal(await dialog.locator('.coupling-batch-choice').filter({ hasText: '하쿠레이 레이무' }).locator('input').isDisabled(), true, 'placed characters cannot be selected again');
  await dialog.getByRole('searchbox', { name: '이름 검색' }).fill('no-character-matches-this-query');
  await dialog.locator('.coupling-batch-empty').waitFor();
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
  await confirmDialog.locator('.coupling-btn-primary').click();
  await confirmDialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 5);
  assert.deepEqual(await page.locator('.coupling-board-node').evaluateAll(nodes => nodes.map(node => node.dataset.node).filter(id => !['reimu', 'marisa'].includes(id)).sort()), ['remilia', 'sakuya', 'youmu']);
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 1, 'the existing edge is preserved');
  assert.deepEqual(await page.locator('[data-node="reimu"],[data-node="marisa"]').evaluateAll(nodes => nodes.map(node => [node.dataset.node, node.style.left, node.style.top])), before.nodes);
  await page.locator('.coupling-board-undo').click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 2);
  assert.equal(await page.locator('.coupling-edge-hit[data-edge]').count(), 1, 'one undo removes the whole batch');
  await page.locator('.coupling-board-more-toggle').click();
  await page.locator('.coupling-board-more-panel').getByRole('button', { name: '다시 실행' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 5);
});
test('whiteboard toolbar panels update relation, direction, and zoom without closing', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.waitForSelector('.coupling-board-controls [data-toolbar-item="move"]');
  const toolbarItems = await page.locator('.coupling-board-controls [data-toolbar-item]').evaluateAll(items => items.map(item => item.dataset.toolbarItem));
  assert.deepEqual(toolbarItems, ['move', 'connect', 'line', 'undo', 'more'], 'only the five primary canvas actions stay in the floating toolbar');
  assert.equal(await page.locator('.coupling-board-view-toggle').count(), 0, 'view actions are available from overflow');
  assert.equal(await page.locator('.coupling-board-redo').count(), 0, 'redo is available from overflow');
  const more = page.locator('.coupling-board-more-toggle');
  const morePanel = page.locator('.coupling-board-more-panel');
  await more.click();
  await morePanel.waitFor({ state: 'visible' });
  assert.equal(await more.getAttribute('aria-expanded'), 'true');
  await more.click();
  await morePanel.waitFor({ state: 'hidden' });
  assert.equal(await more.getAttribute('aria-expanded'), 'false');
  await more.click();
  await morePanel.getByRole('button', { name: '화면' }).click();
  const viewPanel = page.locator('.coupling-board-view-panel');
  await viewPanel.waitFor({ state: 'visible' });
  await viewPanel.locator('.coupling-board-panel-close').click();
  await more.click();
  await morePanel.getByRole('button', { name: '다시 실행' }).waitFor({ state: 'visible' });
  await more.click();
  await page.keyboard.press('Escape');
  await morePanel.waitFor({ state: 'hidden' });

  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.toolbarItem), 'move');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.toolbarItem), 'more');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.toolbarItem), 'move');

  const lineSettings = page.locator('.coupling-board-line-toggle');
  const linePanel = page.locator('.coupling-board-line-settings');
  await lineSettings.click();
  await linePanel.waitFor({ state: 'visible' });
  const friend = linePanel.locator('.coupling-board-relation-choice').filter({ hasText: '친구·가족' });
  await friend.click();
  assert.equal(await friend.getAttribute('aria-pressed'), 'true');
  assert.equal(await linePanel.isVisible(), true, 'line settings stay open while options change');
  assert.match(await lineSettings.getAttribute('aria-label'), /친구·가족/);
  assert.match(await lineSettings.innerText(), /친구·가족/, 'the current relationship is summarized visually in the toolbar');
  const direction = linePanel.locator('.coupling-board-direction-group button').filter({ hasText: '한쪽' });
  await clickAtCenter(page, direction);
  assert.equal(await direction.getAttribute('aria-pressed'), 'true');
  assert.equal(await lineSettings.getAttribute('aria-expanded'), 'true');
  assert.match(await lineSettings.innerText(), /→/, 'the current direction is summarized visually in the toolbar');

  await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').click();
  await page.locator('[data-node="reimu"] .coupling-node-ring').click();
  await page.locator('[data-node="marisa"] .coupling-node-ring').click();
  const edge = page.locator('.coupling-board-edges g .coupling-edge-line');
  await edge.waitFor({ state: 'attached' });
  assert.equal(await edge.getAttribute('marker-end'), 'url(#coupling-arrow-friend)');
  assert.equal(await edge.getAttribute('marker-start'), null, 'a forward relation has only an end arrow');
  const selectedDelete = page.locator('.coupling-selection-delete');
  await selectedDelete.waitFor({ state: 'visible' });
  await selectedDelete.click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-edges g .coupling-edge-line').length === 0);

  await more.click();
  await morePanel.getByRole('button', { name: '화면' }).click();
  await viewPanel.waitFor({ state: 'visible' });
  const zoomBefore = Number.parseInt(await page.locator('.coupling-board-zoom').innerText(), 10);
  await clickAtCenter(page, viewPanel.getByRole('button', { name: '축소' }));
  await page.waitForFunction(previous => Number.parseInt(document.querySelector('.coupling-board-zoom').textContent, 10) < previous, zoomBefore);
  assert.equal(await viewPanel.isVisible(), true, 'zoom actions leave the view panel open');
  const zoomAfterOut = Number.parseInt(await page.locator('.coupling-board-zoom').innerText(), 10);
  await clickAtCenter(page, viewPanel.getByRole('button', { name: '확대' }));
  await page.waitForFunction(previous => Number.parseInt(document.querySelector('.coupling-board-zoom').textContent, 10) > previous, zoomAfterOut);
  await viewPanel.locator('.coupling-board-panel-close').click();
  await viewPanel.waitFor({ state: 'hidden' });
  const undo = page.locator('.coupling-board-undo');
  assert.equal(await undo.isDisabled(), false, 'the toolbar exposes available history');
  await undo.focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.activeElement?.dataset.toolbarItem === 'undo');
  assert.equal(await undo.isVisible(), true, 'undo stays among the primary mobile tools');
  await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.toolbarItem), 'move');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.toolbarItem), 'more');
});

test('whiteboard edge deletion can be undone from immediate feedback', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.waitForSelector('.coupling-whiteboard');
  await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').click();
  await page.locator('[data-node="reimu"] .coupling-node-ring').click();
  await page.locator('[data-node="marisa"] .coupling-node-ring').click();
  await page.locator('.coupling-selection-delete').click();

  const snackbar = page.locator('.coupling-snackbar');
  await snackbar.waitFor({ state: 'visible' });
  assert.match(await snackbar.innerText(), /삭제/);
  await snackbar.getByRole('button', { name: '실행 취소' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-edges g .coupling-edge-line').length === 1);
});

test('whiteboard selected edges can be edited and the complete edit can be undone', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.waitForSelector('.coupling-whiteboard');
  await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').click();
  await page.locator('[data-node="reimu"] .coupling-node-ring').click();
  await page.locator('[data-node="marisa"] .coupling-node-ring').click();

  await page.locator('.coupling-selection-info').getByRole('button', { name: '관계 편집' }).click();
  const panel = page.locator('.coupling-board-line-settings');
  await panel.waitFor({ state: 'visible' });
  await panel.locator('.coupling-board-relation-choice').filter({ hasText: '친구·가족' }).click();
  await panel.locator('[data-preference="favorite"]').click();
  await panel.locator('.coupling-board-direction-group button').filter({ hasText: '한쪽' }).click();
  await panel.getByRole('button', { name: '변경 적용' }).click();

  await page.waitForFunction(() => {
    const edge = JSON.parse(localStorage.getItem('introduce:coupling:whiteboard:v1') ?? '{}').data?.edges?.[0];
    return edge?.type === 'friend' && edge?.preference === 'favorite' && edge?.direction === 'forward';
  });
  await page.locator('.coupling-selection-delete').click();
  await page.locator('.coupling-snackbar').getByRole('button', { name: '실행 취소' }).click();
  await page.waitForFunction(() => {
    const edge = JSON.parse(localStorage.getItem('introduce:coupling:whiteboard:v1') ?? '{}').data?.edges?.[0];
    return edge?.type === 'friend' && edge?.preference === 'favorite' && edge?.direction === 'forward';
  });
});

test('whiteboard cancelling a selected-edge edit does not change the next connection defaults', async t => {
  const page = await pageFor(t, '/coupling/whiteboard');
  await page.waitForSelector('.coupling-whiteboard');
  await page.locator('.coupling-board-tool[data-toolbar-item="connect"]').click();
  await page.locator('[data-node="reimu"] .coupling-node-ring').click();
  await page.locator('[data-node="marisa"] .coupling-node-ring').click();
  await page.locator('.coupling-selection-info').getByRole('button', { name: '관계 편집' }).click();
  const panel = page.locator('.coupling-board-line-settings');
  await panel.waitFor({ state: 'visible' });
  await panel.locator('.coupling-board-relation-choice').filter({ hasText: '친구·가족' }).click();
  await page.keyboard.press('Escape');
  await panel.waitFor({ state: 'hidden' });
  await page.locator('.coupling-board-tool[data-toolbar-item="line"]').click();
  const nextSettings = page.locator('.coupling-board-line-settings');
  await nextSettings.waitFor({ state: 'visible' });
  assert.equal(await nextSettings.locator('.coupling-board-relation-choice').filter({ hasText: '커플링' }).getAttribute('aria-pressed'), 'true');
  assert.equal(await nextSettings.locator('.coupling-board-relation-choice').filter({ hasText: '친구·가족' }).getAttribute('aria-pressed'), 'false');
});


test('keyboard relay displays Alice face portrait, not a pixel sprite', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  await page.waitForSelector('.coupling-keyboard');
  await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  await page.locator('.coupling-keyboard-relations button').first().click();
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  const search = page.locator('.coupling-keyboard-step-picker input[type="search"]');
  await search.fill('앨리스 마가트로이드');
  const avatar = page.locator('.coupling-keyboard-step-picker [data-character="alice"]')
    .locator('.coupling-avatar');
  const image = avatar.locator('img');
  await image.waitFor({ state: 'visible' });
  assert.equal(await avatar.getAttribute('data-portrait-kind'), 'face');
  assert.match(await image.getAttribute('src') ?? '', /\/coupling\/faces\/alice\.png$/);
  await page.waitForFunction(image => image.complete && image.naturalWidth === 512, await image.elementHandle());
});

test('keyboard relay starts at center selection with the picker open', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  await page.waitForSelector('.coupling-keyboard');
  assert.equal(await page.locator('.coupling-keyboard').getAttribute('data-stage'), 'source');
  assert.equal(await page.locator('.coupling-keyboard-step .coupling-picker').count(), 1, 'the center picker is inside the active workflow step');
  assert.equal(await page.locator('.coupling-keyboard-library').count(), 0, 'there is no separate library panel or center/partner mode switch');
  assert.equal(await page.locator('.coupling-keyboard-toolbar strong').innerText(), '현재 중심을 선택하세요', 'an unselected default character is not presented as the current center');
});

test('keyboard relay keeps relationship and preference in one explicit step and reset returns to center selection', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  const root = page.locator('.coupling-keyboard');
  await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  assert.equal(await root.getAttribute('data-stage'), 'relation');
  const relationChoice = page.locator('.coupling-keyboard-relations button').first();
  await relationChoice.click();
  assert.equal(await root.getAttribute('data-stage'), 'relation', 'choosing a relationship does not skip its preference controls');
  assert.equal(await page.locator('.coupling-keyboard-preference-setting').isVisible(), true);
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  assert.equal(await root.getAttribute('data-stage'), 'target');
  assert.equal(await page.locator('.coupling-keyboard-step .coupling-picker').count(), 1, 'the same step body hosts partner selection');
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '이전' }).click();
  assert.equal(await root.getAttribute('data-stage'), 'relation', 'previous returns to relationship settings');
  await page.locator('.coupling-keyboard-management summary').click();
  const reset = page.getByRole('button', { name: '초기화' });
  const confirmation = page.waitForEvent('dialog');
  const resetClick = reset.click();
  (await confirmation).accept();
  await resetClick;
  assert.equal(await root.getAttribute('data-stage'), 'source', 'reset returns to the true first step');
  assert.equal(await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').count(), 1);
});

test('keyboard relay has one center-selection control and updates the graph preview', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  await page.waitForSelector('.coupling-keyboard');
  assert.equal(await page.locator('.coupling-keyboard-roster').count(), 0, 'the graph has no duplicate center roster');
  await page.locator('.coupling-keyboard-step-picker [data-character="marisa"]').click();
  await page.waitForFunction(() => document.querySelector('.coupling-keyboard-graph-panel .coupling-keyboard-toolbar strong')?.textContent?.includes('마리사'));
  assert.equal(await page.locator('.coupling-keyboard-source-slot').count(), 1, 'the side rail is the single center-selection control');
});

test('keyboard relay handles the 1-1-Enter sequence, reverse updates, and IME events', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  const root = page.locator('.coupling-keyboard');
  await page.waitForSelector('.coupling-keyboard');
  await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  await root.focus();
  await root.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: '1', keyCode: 229, bubbles: true, isComposing: true })));
  assert.equal(await root.getAttribute('data-stage'), 'relation', 'IME composition does not advance the relay');
  await page.keyboard.press('1');
  assert.equal(await root.getAttribute('data-stage'), 'relation', 'relationship shortcuts select without advancing');
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  assert.equal(await root.getAttribute('data-stage'), 'target');
  await root.focus();
  await page.keyboard.press('1');
  assert.equal(await root.getAttribute('data-stage'), 'confirm');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.coupling-keyboard-relation').length === 1);
  const search = page.locator('.coupling-keyboard-step-picker input[type="search"]');
  await search.fill('레이무');
  await search.dispatchEvent('compositionstart');
  const stageBeforeComposition = await root.getAttribute('data-stage');
  await search.evaluate(element => element.dispatchEvent(new KeyboardEvent('keydown', { key: '1', keyCode: 229, bubbles: true, isComposing: true })));
  assert.equal(await root.getAttribute('data-stage'), stageBeforeComposition, 'search composition cannot advance a relay stage');
  assert.equal(await page.locator('.coupling-keyboard-relation').count(), 1, 'search composition cannot change a relation');
  await search.dispatchEvent('compositionend');
  await search.fill('');

  await page.getByRole('button', { name: '중심 변경' }).click();
  await page.locator('.coupling-keyboard-step-picker [data-character="marisa"]').click();
  await page.locator('.coupling-keyboard-relations button').first().click();
  await page.keyboard.press('2');
  await page.locator('.coupling-keyboard-preference-setting [data-preference="favorite"]').click();
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  await page.locator('.coupling-keyboard-step-picker input[type="search"]').fill('레이무');
  await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  assert.equal(await root.getAttribute('data-stage'), 'confirm');
  await page.locator('.coupling-keyboard-actions .coupling-btn-primary').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:keyboard:v1') ?? '{}').data?.edges?.[0]?.relation === 'friend' && JSON.parse(localStorage.getItem('introduce:coupling:keyboard:v1') ?? '{}').data?.edges?.[0]?.preference === 'favorite');
  assert.equal(await root.getAttribute('data-stage'), 'target', 'confirmation returns directly to partner selection for consecutive entry');
  assert.match(await page.locator('.coupling-keyboard-source-slot').innerText(), /마리사/, 'the center remains selected');
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '이전' }).click();
  assert.equal(await page.locator('.coupling-keyboard-relations button').filter({ hasText: '친구·가족' }).getAttribute('aria-pressed'), 'true', 'the relationship setting remains selected after saving');
  assert.equal(await page.locator('.coupling-keyboard-preference-setting [data-preference="favorite"]').getAttribute('aria-pressed'), 'true', 'the preference remains selected after saving');
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  assert.equal(await page.locator('.coupling-keyboard-relation').count(), 1, 'reversing the center updates the existing unordered pair');
  assert.match(await page.locator('.coupling-keyboard-relation').first().innerText(), /친구·가족.*최애/);

  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const stored = await readDraft(page, 'introduce:coupling:keyboard:v1');
  assert.equal(stored.data.edges.length, 1);
  assert.equal(stored.data.edges[0].relation, 'friend');
  assert.equal(stored.data.edges[0].preference, 'favorite');
  assert.deepEqual(new Set([stored.data.edges[0].a, stored.data.edges[0].b]), new Set(['reimu', 'marisa']));
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:keyboard:v1']);
  await page.reload();
  await page.waitForSelector('.coupling-keyboard');
  assert.equal(await page.locator('.coupling-keyboard-relation').count(), 1);
});

test('keyboard relay shortcuts follow filtered results and confirmation edits relationship settings', async t => {
  const page = await pageFor(t, '/coupling/keyboard');
  const root = page.locator('.coupling-keyboard');
  await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  await page.locator('.coupling-keyboard-relations button').first().click();
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  await page.locator('.coupling-keyboard-step-picker input[type="search"]').fill('앨리스 마가트로이드');
  await root.focus();
  await page.keyboard.press('1');
  assert.equal(await root.getAttribute('data-stage'), 'confirm');
  assert.match(await page.locator('.coupling-keyboard-pending').innerText(), /앨리스 마가트로이드/);

  const relation = page.locator('.coupling-keyboard-confirm-relations').getByRole('button', { name: /친구·가족/ });
  await relation.click();
  await page.locator('.coupling-keyboard-confirm-preference [data-preference="favorite"]').click();
  await page.locator('.coupling-keyboard-actions').getByRole('button', { name: '연결하기' }).click();
  await page.waitForFunction(() => {
    const edge = JSON.parse(localStorage.getItem('introduce:coupling:keyboard:v1') ?? '{}').data?.edges?.[0];
    return edge?.relation === 'friend' && edge?.preference === 'favorite' && edge?.b === 'alice';
  });
});


test('pair cards prevent self-pairs, preserve direction and memo, deduplicate, edit, and reorder', async t => {
  const page = await pageFor(t, '/coupling/pairs');
  const picker = page.locator('.coupling-pairs-picker-dialog');
  const pick = async id => {
    if (!(await picker.evaluate(dialog => dialog.open))) await page.locator('.coupling-pairs-slot[aria-pressed="true"]').click();
    await picker.locator(`[data-character="${id}"]`).click();
  };
  const save = async name => page.getByRole('button', { name }).click();
  const choosePair = async (a, b) => { await pick(a); await pick(b); };
  const count = () => page.locator('.coupling-pair-card').count();

  assert.equal(await picker.evaluate(dialog => dialog.open), false, 'the character picker is closed until a slot is chosen');
  await page.locator('.coupling-pairs-slot[aria-pressed="true"]').click();
  await picker.waitFor({ state: 'visible' });
  await picker.locator('[data-character="reimu"]').click();
  assert.equal(await picker.evaluate(dialog => dialog.open), true, 'choosing A keeps the picker open for B');
  assert.equal(await picker.locator('.coupling-pairs-picker-slots button[aria-pressed="true"] strong').innerText(), 'B');
  await picker.locator('[data-character="marisa"]').click();
  await picker.waitFor({ state: 'hidden' });
  await page.locator('.coupling-pairs-slot[aria-pressed="true"]').click();
  assert.equal(await picker.locator('[data-character="reimu"]').isDisabled(), true, 'the other selected character cannot be chosen twice');
  await picker.locator('header button').click();
  await picker.waitFor({ state: 'hidden' });
  const slotWidths = await page.locator('.coupling-pairs-slot-wrap').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  assert.equal(slotWidths.length, 2);
  assert.ok(slotWidths.every(width => width >= 200), `both character slots remain usable at desktop width: ${slotWidths.join(', ')}`);
  assert.ok(Math.abs(slotWidths[0] - slotWidths[1]) < 1, 'the A and B character slots have matching widths');
  await page.locator('.coupling-pairs-controls input[name="pairRelation"][value="ally"]').check();
  await page.locator('.coupling-pairs-preference-group [data-preference="favorite"]').click();
  await page.locator('.coupling-pairs-fields textarea').fill('favorite scene\nfirst note');
  await save('카드 저장');
  assert.equal(await count(), 1);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /레이무.*마리사|레이무[\s\S]*마리사/);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /favorite scene\nfirst note/);
  assert.match(await page.locator('.coupling-pair-card').first().locator('.coupling-pair-card-top').innerText(), /동료·동맹.*최애/);

  await save('새 카드');
  await choosePair('reimu', 'marisa');
  await save('카드 저장');
  assert.equal(await count(), 1, 'a duplicate forward card is rejected');
  assert.equal(await page.locator('.coupling-pairs-feedback').getAttribute('data-tone'), 'error');

  await save('새 카드');
  await choosePair('reimu', 'marisa');
  await page.locator('.coupling-pairs-controls input[name="pairDirection"][value="reverse"]').check();
  await page.locator('.coupling-pairs-fields textarea').fill('reverse direction');
  await save('카드 저장');
  assert.equal(await count(), 2, 'the reciprocal directed relationship is distinct');
  assert.match(await page.locator('.coupling-pair-card').nth(1).locator('.coupling-pair-caption').innerText(), /마리사.*→.*레이무/);

  await save('새 카드');
  await choosePair('sakuya', 'youmu');
  await page.locator('.coupling-pairs-controls input[name="pairDirection"][value="mutual"]').check();
  await page.locator('.coupling-pairs-fields textarea').fill('mutual note');
  await save('카드 저장');
  assert.equal(await count(), 3);
  await page.locator('.coupling-pair-card').nth(2).locator('.coupling-pair-secondary-actions summary').click();
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
  await page.locator('.coupling-pairs-controls input[name="pairDirection"][value="mutual"]').check();
  await save('카드 수정 저장');
  assert.equal(await count(), 3);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /edited memo/);

  await page.locator('.coupling-pair-card').first().locator('.coupling-pair-secondary-actions summary').click();
  await page.locator('.coupling-pair-card').first().getByRole('button', { name: '삭제' }).click();
  assert.equal(await count(), 2, 'deleting a pair card removes only that card');
  await page.locator('.coupling-snackbar').getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await count(), 3, 'undo restores the deleted pair card');
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /edited memo/);

  await save('새 카드');
  await choosePair('marisa', 'reimu');
  await page.locator('.coupling-pairs-controls input[name="pairDirection"][value="mutual"]').check();
  await save('카드 저장');
  assert.equal(await count(), 3, 'mutual pairs deduplicate regardless of slot order');
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.coupling-pair-card').length === 3);
  assert.equal(await count(), 3);
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /edited memo/);
  const stored = await readDraft(page, 'introduce:coupling:pairs:v1');
  assert.equal(stored.data.pairs.length, 3);
  assert.equal(stored.data.pairs[0].relation, 'ally');
  assert.equal(stored.data.pairs[0].preference, 'favorite');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:pairs:v1']);
});

test('pair card collection filters and sorts without changing saved order and offers undo on delete', async t => {
  const page = await pageFor(t, '/coupling/pairs');
  const picker = page.locator('.coupling-pairs-picker-dialog');
  const createPair = async (a, b, relation) => {
    await page.locator('.coupling-pairs-slot[aria-pressed="true"]').click();
    await picker.locator(`[data-character="${a}"]`).click();
    await picker.locator(`[data-character="${b}"]`).click();
    await page.locator(`input[name="pairRelation"][value="${relation}"]`).check();
    await page.getByRole('button', { name: '카드 저장' }).click();
  };
  await createPair('reimu', 'marisa', 'love');
  await createPair('sakuya', 'youmu', 'ally');
  assert.equal(await page.locator('.coupling-pair-card').count(), 2);

  await page.locator('.coupling-pairs-filter').selectOption('ally');
  assert.equal(await page.locator('.coupling-pair-card').count(), 1, 'the relation filter only changes the visible collection');
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /사쿠야/);
  await page.locator('.coupling-pairs-filter').selectOption('all');
  await page.locator('.coupling-pairs-sort').selectOption('za');
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /레이무/);
  assert.match(await page.locator('.coupling-pair-card').nth(1).innerText(), /사쿠야/);

  const card = page.locator('.coupling-pair-card').first();
  await card.locator('.coupling-pair-secondary-actions summary').click();
  await card.getByRole('button', { name: '삭제' }).click();
  await page.locator('.coupling-snackbar').getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.coupling-pair-card').count(), 2, 'undo restores the card to the collection');
  assert.match(await page.locator('.coupling-pair-card').first().innerText(), /레이무/, 'undo leaves the current sort view in place');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:pairs:v1') ?? '{}').data?.pairs?.length === 2);
  assert.equal((await readDraft(page, 'introduce:coupling:pairs:v1')).data.pairs.length, 2, 'view controls do not mutate persisted cards');
});


test('matrix keeps directed records independent, unordered records symmetric, and removal undoable', async t => {
  const page = await pageFor(t, '/coupling/matrix');
  assert.equal(await page.locator('.coupling-relationship-matrix').getAttribute('role'), 'grid');
  const firstCell = page.locator('.coupling-relationship-matrix tbody tr').first().locator('button:not(:disabled)').first();
  const lastCell = page.locator('.coupling-relationship-matrix tbody tr').last().locator('button:not(:disabled)').last();
  const secondCell = page.locator('.coupling-relationship-matrix tbody tr').first().locator('button:not(:disabled)').nth(1);
  await firstCell.focus();
  await page.keyboard.press('ArrowRight');
  assert.deepEqual(await page.evaluate(() => [document.activeElement?.dataset.from, document.activeElement?.dataset.to]), [await secondCell.getAttribute('data-from'), await secondCell.getAttribute('data-to')], 'arrow keys move within a row');
  await page.keyboard.press('End');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.to), await page.locator('.coupling-relationship-matrix tbody tr').first().locator('button:not(:disabled)').last().getAttribute('data-to'), 'End moves to the last usable cell in the row');
  await page.keyboard.press('Control+End');
  assert.deepEqual(await page.evaluate(() => [document.activeElement?.dataset.from, document.activeElement?.dataset.to]), [await lastCell.getAttribute('data-from'), await lastCell.getAttribute('data-to')], 'Ctrl+End moves to the last usable grid cell');
  assert.equal(await page.locator('.coupling-relationship-matrix tbody th[data-focused-axis="row"]').count(), 1);
  assert.equal(await page.locator('.coupling-relationship-matrix thead th[data-focused-axis="column"]').count(), 1);
  const forward = page.locator('button[data-from="reimu"][data-to="marisa"]');
  const reverse = page.locator('button[data-from="marisa"][data-to="reimu"]');
  await page.locator('.coupling-matrix-palette').getByRole('button', { name: /동료·동맹/ }).click();
  await forward.focus();
  await page.keyboard.press('x');
  assert.equal(await page.locator('.coupling-matrix-preference [data-preference="avoid"]').getAttribute('aria-pressed'), 'true', 'X selects the not-for-me preference');
  await page.keyboard.press('0');
  await page.keyboard.press('f');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:matrix:v1') ?? '{}').data?.directed?.[0]?.preference === 'favorite');
  await page.locator('.coupling-matrix-palette').getByRole('button', { name: /친구·가족/ }).click();
  await reverse.focus();
  await page.keyboard.press('0');
  await page.keyboard.press('Enter');
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
  await page.locator('.coupling-matrix-controls').getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.coupling-matrix-chip').count(), 6);
  assert.equal(await page.locator('button[data-from="reimu"][data-to="marisa"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('button[data-from="marisa"][data-to="reimu"]').getAttribute('aria-pressed'), 'true');
  await page.reload();
  assert.equal(await page.locator('.coupling-matrix-mode button:first-child').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.coupling-matrix-mode button:first-child').innerText(), '방향 있음 (2)');
  assert.equal(await page.locator('.coupling-matrix-mode button:nth-child(2)').innerText(), '방향 없음 (1)');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('introduce:coupling:'))), ['introduce:coupling:matrix:v1']);
  const stored = await readDraft(page, 'introduce:coupling:matrix:v1');
  assert.equal(stored.data.directed.find(edge => edge.from === 'reimu' && edge.to === 'marisa').relation, 'ally');
  assert.equal(stored.data.directed.find(edge => edge.from === 'reimu' && edge.to === 'marisa').preference, 'favorite');
  assert.equal(stored.data.directed.find(edge => edge.from === 'marisa' && edge.to === 'reimu').relation, 'friend');
  assert.equal(stored.data.directed.find(edge => edge.from === 'marisa' && edge.to === 'reimu').preference, null);
});

test('matrix keeps entry context visible, supports compact pair entry, and undoes edits', async t => {
  const page = await pageFor(t, '/coupling/matrix', { width: 390, height: 844 });
  const context = page.locator('.coupling-matrix-context');
  await context.waitFor({ state: 'visible' });
  assert.match(await context.innerText(), /커플링.*표시 없음[\s\S]*방향 있음/);
  assert.match(await context.innerText(), /각 모드의 관계는 별도로 저장/);

  await page.locator('.coupling-matrix-view-toggle').getByRole('button', { name: '짝 입력' }).click();
  await page.locator('.coupling-matrix-pair-entry-from').selectOption('reimu');
  await page.locator('.coupling-matrix-pair-entry-to').selectOption('marisa');
  await page.locator('.coupling-matrix-palette').getByRole('button', { name: /친구·가족/ }).click();
  await page.locator('.coupling-matrix-preference [data-preference="favorite"]').click();
  await page.getByRole('button', { name: '관계 적용' }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:matrix:v1') ?? '{}').data?.directed?.[0]?.relation === 'friend');
  await page.locator('.coupling-snackbar').getByRole('button', { name: '실행 취소' }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:matrix:v1') ?? '{}').data?.directed?.length === 0);

  await page.locator('.coupling-matrix-mode').getByRole('button', { name: /방향 없음/ }).click();
  assert.match(await context.innerText(), /방향 없음.*별도로 저장/);
  await page.getByRole('button', { name: '관계 적용' }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:coupling:matrix:v1') ?? '{}').data?.unordered?.length === 1);
  const stored = await readDraft(page, 'introduce:coupling:matrix:v1');
  assert.equal(stored.data.directed.length, 0, 'changing modes does not move records between collections');
  assert.deepEqual(stored.data.unordered[0], { from: 'marisa', to: 'reimu', relation: 'friend', preference: 'favorite' });
});



test('mobile touch scrolls canvas panels and keeps batch, connection, deletion, and matrix flows usable', async t => {
  const page = await mobilePageFor(t, '/coupling/whiteboard');
  const tap = async locator => {
    const target = typeof locator === 'string' ? page.locator(locator) : locator;
    let box = await target.boundingBox();
    assert.ok(box, 'touch target has a visible box');
    const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
    if (box.x < 0 || box.y < 0 || box.x + box.width > viewport.width || box.y + box.height > viewport.height) {
      await target.scrollIntoViewIfNeeded();
      box = await target.boundingBox();
    }
    assert.ok(box, 'touch target is reachable in the viewport');
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  };
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 6);
  const boardBounds = await page.locator('.coupling-board-viewport').boundingBox();
  const toolbarBounds = await page.locator('.coupling-board-controls').boundingBox();
  const addBounds = await page.locator('.coupling-board-add').boundingBox();
  assert.ok(toolbarBounds && toolbarBounds.width <= 300 && toolbarBounds.height <= 64, 'the mobile floating tool menu is compact');
  assert.ok(await page.locator('.coupling-board-controls .coupling-board-tool:visible').evaluateAll(buttons => buttons.every(button => {
    const rect = button.getBoundingClientRect();
    return rect.width >= 48 && rect.height >= 48;
  })), 'compact toolbar controls preserve accessible touch targets');
  const insideBoard = bounds => bounds && bounds.x >= boardBounds.x && bounds.y >= boardBounds.y && bounds.x + bounds.width <= boardBounds.x + boardBounds.width && bounds.y + bounds.height <= boardBounds.y + boardBounds.height;
  assert.ok(boardBounds && insideBoard(toolbarBounds) && insideBoard(addBounds), 'toolbar and add action stay within the mobile canvas');
  const controlsAvoidNodes = () => page.evaluate(() => {
    const controls = [...document.querySelectorAll('.coupling-board-controls,.coupling-board-add')].map(element => element.getBoundingClientRect());
    return [...document.querySelectorAll('.coupling-board-node')].every(node => {
      const bounds = node.getBoundingClientRect();
      return controls.every(control => bounds.right <= control.left || bounds.left >= control.right || bounds.bottom <= control.top || bounds.top >= control.bottom);
    });
  });
  assert.ok(await controlsAvoidNodes(), 'the dock and add action do not cover initial character hit targets');
  const readCanvas = () => page.evaluate(() => {
    const viewport = document.querySelector('.coupling-board-viewport');
    return {
      nodes: [...document.querySelectorAll('.coupling-board-node')].map(node => [node.dataset.node, node.style.left, node.style.top]),
      edges: [...document.querySelectorAll('.coupling-edge-hit[data-edge]')].map(edge => [edge.dataset.edge, edge.getAttribute('d')]),
      view: viewport.querySelector('.coupling-board-world').style.transform,
      scroll: [scrollX, scrollY, viewport.scrollLeft, viewport.scrollTop],
      stored: localStorage.getItem('introduce:coupling:whiteboard:v1'),
    };
  });
  const beforePanels = await readCanvas();
  const noHorizontalOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

  await tap('.coupling-board-more-toggle');
  const morePanel = page.locator('.coupling-board-more-panel');
  assert.ok(insideBoard(await morePanel.boundingBox()), 'the More panel fits inside the mobile canvas');
  assert.ok(await noHorizontalOverflow(), 'the More panel does not widen the page');
  await tap('.coupling-board-more-toggle');

  await tap('.coupling-board-line-toggle');
  const linePanel = page.locator('.coupling-board-line-settings');
  assert.ok(insideBoard(await linePanel.boundingBox()), 'line settings fit inside the mobile canvas');
  assert.ok(await noHorizontalOverflow(), 'line settings do not widen the page');
  const body = linePanel.locator('.coupling-board-panel-body');
  const scrollRange = await body.evaluate(element => element.scrollHeight - element.clientHeight);
  assert.ok(scrollRange > 0, 'line settings provide an internally scrollable body');
  const bodyBounds = await body.boundingBox();
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bodyBounds.x + bodyBounds.width / 2, y: bodyBounds.y + bodyBounds.height - 12, id: 1 }] });
  await page.waitForTimeout(40);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bodyBounds.x + bodyBounds.width / 2, y: bodyBounds.y + 12, id: 1 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction(() => document.querySelector('.coupling-board-line-settings .coupling-board-panel-body')?.scrollTop > 0);
  assert.deepEqual(await readCanvas(), beforePanels, 'opening and scrolling panels leaves the board and saved draft unchanged');
  await tap(linePanel.locator('.coupling-board-panel-close'));
  await linePanel.waitFor({ state: 'hidden' });

  await tap('.coupling-board-more-toggle');
  await tap(morePanel.getByRole('button', { name: '화면' }));
  const viewPanel = page.locator('.coupling-board-view-panel');
  assert.ok(insideBoard(await viewPanel.boundingBox()), 'view controls fit inside the mobile canvas');
  assert.ok(await noHorizontalOverflow(), 'view controls do not widen the page');
  await tap(viewPanel.locator('.coupling-board-panel-close'));
  await viewPanel.waitFor({ state: 'hidden' });
  assert.deepEqual(await readCanvas(), beforePanels, 'closing view controls preserves the board draft');

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

  await tap('.coupling-board-add');
  const dialog = page.locator('.coupling-batch-dialog');
  const dialogBox = await dialog.boundingBox();
  const viewport = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  assert.ok(dialogBox && dialogBox.x >= 0 && dialogBox.y >= 0 && dialogBox.x + dialogBox.width <= viewport.width && dialogBox.y + dialogBox.height <= viewport.height, 'batch dialog fits the mobile viewport');
  for (const addition of additions) {
    await chooseBatchWork(dialog, addition.group);
    await tap(dialog.locator('.coupling-batch-choice').filter({ hasText: addition.name }).locator('input'));
  }
  assert.equal(await dialog.locator('.coupling-batch-pending button').count(), additions.length, 'one selection from each work remains pending');
  await tap(dialog.locator('.coupling-btn-primary'));
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 8);

  await tap('.coupling-board-tool[data-toolbar-item="connect"]');
  await tap('[data-node="reimu"] .coupling-node-ring');
  await tap('[data-node="marisa"] .coupling-node-ring');
  await page.waitForFunction(() => document.querySelectorAll('.coupling-edge-hit[data-edge]').length === 1);
  await tap('.coupling-board-tool[data-toolbar-item="move"]');
  await tap('[data-node="reimu"] .coupling-node-ring');
  await tap('.coupling-selection-delete');
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
  await touch.detach();
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


test('legacy favorite and avoid relationship types migrate to preference markers in every editor', async t => {
  const page = await pageFor(t, '/coupling/whiteboard', { width: 1280, height: 900 }, () => {
    const save = (key, data) => localStorage.setItem(key, JSON.stringify({ version: 1, data }));
    save('introduce:coupling:whiteboard:v1', { nodes: [{ id: 'reimu', x: 0, y: 0 }, { id: 'marisa', x: 128, y: 0 }], edges: [{ id: 'edge-1', from: 'reimu', to: 'marisa', type: 'favorite', direction: 'both' }], view: { x: 0, y: 0, zoom: 1 } });
    save('introduce:coupling:keyboard:v1', { sourceId: 'reimu', edges: [{ a: 'reimu', b: 'marisa', relation: 'avoid' }] });
    save('introduce:coupling:pairs:v1', { pairs: [{ id: 'pair-1', a: 'reimu', b: 'marisa', relation: 'favorite', direction: 'mutual', memo: 'keep memo' }], draft: { a: 'sakuya', b: 'youmu', relation: 'avoid', direction: 'forward', memo: 'keep draft' }, activeSlot: 'a', editingId: 'pair-1' });
    save('introduce:coupling:matrix:v1', { roster: ['reimu', 'marisa'], mode: 'directed', directed: [{ from: 'reimu', to: 'marisa', relation: 'favorite' }], unordered: [{ from: 'reimu', to: 'marisa', relation: 'avoid' }] });
  });
  await page.waitForFunction(() => {
    const data = key => JSON.parse(localStorage.getItem(key) ?? 'null')?.data;
    const whiteboard = data('introduce:coupling:whiteboard:v1'), keyboard = data('introduce:coupling:keyboard:v1');
    const pairs = data('introduce:coupling:pairs:v1'), matrix = data('introduce:coupling:matrix:v1');
    return whiteboard?.edges?.[0]?.type === 'complex' && whiteboard.edges[0].preference === 'favorite'
      && keyboard?.edges?.[0]?.relation === 'complex' && keyboard.edges[0].preference === 'avoid'
      && pairs?.pairs?.[0]?.relation === 'complex' && pairs.pairs[0].preference === 'favorite'
      && pairs.draft.relation === 'complex' && pairs.draft.preference === 'avoid'
      && matrix?.directed?.[0]?.relation === 'complex' && matrix.directed[0].preference === 'favorite'
      && matrix.unordered?.[0]?.relation === 'complex' && matrix.unordered[0].preference === 'avoid';
  });
  const whiteboard = await readDraft(page, 'introduce:coupling:whiteboard:v1');
  assert.deepEqual(whiteboard.data.nodes.map(node => [node.id, node.x, node.y]), [['reimu', 0, 0], ['marisa', 128, 0]]);
  assert.match(await page.locator('.coupling-edge-list').innerText(), /복잡·미정.*최애/);
  await page.goto(`${base}/coupling/keyboard`);
  await page.waitForSelector('.coupling-keyboard');
  await page.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  assert.match(await page.locator('.coupling-keyboard-relation').innerText(), /복잡·미정[\s\S]*취향 아님/);
  await page.goto(`${base}/coupling/pairs`);
  await page.waitForSelector('.coupling-pairs');
  assert.match(await page.locator('.coupling-pair-card').innerText(), /복잡·미정[\s\S]*최애/);
  assert.equal(await page.locator('.coupling-pairs-preference-group [data-preference="avoid"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.coupling-pairs-fields textarea').inputValue(), 'keep draft');
  await page.goto(`${base}/coupling/matrix`);
  await page.waitForSelector('.coupling-matrix-editor');
  assert.match(await page.locator('.coupling-matrix-summary li').innerText(), /복잡·미정[\s\S]*최애/);
  await page.locator('.coupling-matrix-mode button:nth-child(2)').click();
  assert.match(await page.locator('.coupling-matrix-summary li').innerText(), /복잡·미정[\s\S]*취향 아님/);
});

test('all four editors reset only their own draft to first-use state', async t => {
  const keys = {
    whiteboard: 'introduce:coupling:whiteboard:v1',
    keyboard: 'introduce:coupling:keyboard:v1',
    pairs: 'introduce:coupling:pairs:v1',
    matrix: 'introduce:coupling:matrix:v1',
  };
  const page = await pageFor(t, '/coupling/whiteboard', undefined, () => {
    if (localStorage.getItem('test:coupling-reset-seeded')) return;
    localStorage.setItem('test:coupling-reset-seeded', '1');
    const save = (key, data) => localStorage.setItem(key, JSON.stringify({ version: 1, data }));
    save('introduce:coupling:whiteboard:v1', {
      nodes: [{ id: 'reimu', x: 0, y: 0 }, { id: 'marisa', x: 128, y: 0 }, { id: 'sakuya', x: 256, y: 0 }],
      edges: [{ id: 'edge-1', from: 'reimu', to: 'marisa', type: 'love', preference: null, direction: 'both' }],
      view: { x: 0, y: 0, zoom: 1 },
    });
    save('introduce:coupling:keyboard:v1', { sourceId: 'marisa', edges: [{ a: 'marisa', b: 'reimu', relation: 'rival', preference: 'avoid' }] });
    save('introduce:coupling:pairs:v1', {
      pairs: [{ id: 'pair-1', a: 'reimu', b: 'marisa', relation: 'ally', preference: 'favorite', direction: 'mutual', memo: 'saved memo' }],
      draft: { a: 'sakuya', b: 'youmu', relation: 'rival', preference: 'avoid', direction: 'forward', memo: 'unsaved memo' },
      activeSlot: 'b',
      editingId: 'pair-1',
    });
    save('introduce:coupling:matrix:v1', {
      roster: ['reimu', 'marisa', 'sakuya'],
      mode: 'unordered',
      directed: [{ from: 'reimu', to: 'marisa', relation: 'friend', preference: null }],
      unordered: [{ from: 'reimu', to: 'sakuya', relation: 'rival', preference: 'avoid' }],
    });
  });
  const stored = key => page.evaluate(storageKey => localStorage.getItem(storageKey), key);
  const confirmReset = async button => {
    let message = '';
    page.once('dialog', async dialog => { message = dialog.message(); await dialog.accept(); });
    await button.click();
    assert.match(message, /이 편집기의 초안/);
  };

  await page.waitForSelector('.coupling-whiteboard');
  assert.equal(await page.locator('.coupling-board-node').count(), 3);
  assert.equal(await page.locator('.coupling-edge-list button').count(), 1);
  await page.locator('.coupling-board-more-toggle').click();
  const whiteboardReset = page.locator('.coupling-board-more-panel').getByRole('button', { name: '초기화' });
  page.once('dialog', dialog => dialog.dismiss());
  await whiteboardReset.click();
  assert.equal(await page.locator('.coupling-board-node').count(), 3, 'cancelling reset leaves the current board intact');
  assert.equal((await stored(keys.whiteboard)) !== null, true);
  await confirmReset(whiteboardReset);
  await page.waitForFunction(() => document.querySelectorAll('.coupling-board-node').length === 6 && document.querySelectorAll('.coupling-edge-list button').length === 0);
  assert.deepEqual(await page.locator('.coupling-board-node').evaluateAll(nodes => nodes.map(node => node.dataset.node)), ['reimu', 'marisa', 'sakuya', 'remilia', 'youmu', 'yuyuko']);
  assert.equal(await stored(keys.whiteboard), null);
  assert.notEqual(await stored(keys.keyboard), null, 'reset leaves other editor drafts untouched');

  await page.goto(`${base}/coupling/keyboard`);
  await page.waitForSelector('.coupling-keyboard');
  assert.equal(await page.locator('.coupling-keyboard-node.is-partner').count(), 1);
  await page.locator('.coupling-keyboard-management summary').click();
  await confirmReset(page.getByRole('button', { name: '초기화' }));
  assert.equal(await page.locator('.coupling-keyboard-node.is-partner').count(), 0);
  assert.match(await page.locator('.coupling-keyboard-graph-panel .coupling-keyboard-toolbar > strong').innerText(), /중심을 선택/);
  assert.equal(await stored(keys.keyboard), null);
  assert.notEqual(await stored(keys.pairs), null);

  await page.goto(`${base}/coupling/pairs`);
  await page.waitForSelector('.coupling-pairs');
  assert.equal(await page.locator('.coupling-pair-card').count(), 1);
  assert.equal(await page.locator('.coupling-pairs-fields textarea').inputValue(), 'unsaved memo');
  await confirmReset(page.getByRole('button', { name: '초기화' }));
  assert.equal(await page.locator('.coupling-pair-card').count(), 0);
  assert.equal(await page.locator('.coupling-pairs-fields textarea').inputValue(), '');
  assert.equal(await stored(keys.pairs), null);
  assert.notEqual(await stored(keys.matrix), null);

  await page.goto(`${base}/coupling/matrix`);
  await page.waitForSelector('.coupling-matrix-editor');
  assert.equal(await page.locator('.coupling-matrix-summary li').count(), 1);
  await confirmReset(page.getByRole('button', { name: '초기화' }));
  assert.equal(await page.locator('.coupling-matrix-mode button:nth-child(1)').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.coupling-matrix-chip').count(), 6);
  assert.equal(await page.locator('.coupling-matrix-summary li').count(), 0);
  assert.equal(await stored(keys.matrix), null);
  await page.evaluate(() => localStorage.removeItem('test:coupling-reset-seeded'));
});


test('malformed drafts remain untouched until edit, pagehide flushes, and blocked storage stays usable', async t => {
  const malformed = await pageFor(t, '/coupling/keyboard', { width: 1280, height: 900 }, () => {
    localStorage.setItem('introduce:coupling:keyboard:v1', '{broken');
  });
  await malformed.waitForSelector('.coupling-keyboard');
  assert.match(await malformed.locator('.coupling-keyboard-session').innerText(), /저장된 초안을 복원하지 못했습니다/);
  assert.equal(await malformed.evaluate(() => localStorage.getItem('introduce:coupling:keyboard:v1')), '{broken');
  await malformed.locator('.coupling-keyboard-step-picker [data-character="reimu"]').click();
  await malformed.locator('.coupling-keyboard-relations button').first().click();
  await malformed.locator('.coupling-keyboard-actions').getByRole('button', { name: '다음' }).click();
  await malformed.locator('.coupling-keyboard-step-picker [data-character="marisa"]').click();
  await malformed.locator('.coupling-keyboard-actions .coupling-btn-primary').click();
  await malformed.waitForFunction(() => document.querySelectorAll('.coupling-keyboard-relation').length === 1);
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
  const picker = blocked.locator('.coupling-pairs-picker-dialog');
  await blocked.locator('.coupling-pairs-slot[aria-pressed="true"]').click();
  await picker.locator('[data-character="reimu"]').click();
  await picker.locator('[data-character="marisa"]').click();
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
