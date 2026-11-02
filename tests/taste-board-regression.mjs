import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { createServer } from 'vite';

let server;
let browser;
let base;

before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function pageFor(t, route = '/characters/tastes', viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ locale: 'ko-KR', viewport });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(`${base}${route}`);
  return page;
}

async function openGroupDialog(page, mode) {
  await page.getByRole('button', { name: '그룹 추가', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  if (mode) await dialog.getByLabel('추가 방식').selectOption(mode);
  return dialog;
}

async function addEmptyGroup(page) {
  const dialog = await openGroupDialog(page, 'empty');
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
}

const characterButton = (container, name) => container.getByRole('button', { name, exact: true });

async function savedBoard(page) {
  await page.waitForFunction(() => localStorage.getItem('introduce:characters:taste-board:v1') !== null);
  return page.evaluate(() => JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1')).data);
}

test('desktop taste picker shows large portrait cards beside its filters', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').first().click();
  const dialog = page.getByRole('dialog', { name: '캐릭터 선택' });
  const filter = await dialog.getByLabel('작품 분류').boundingBox();
  const list = await dialog.locator('.taste-character-list').boundingBox();
  const avatar = await dialog.locator('.taste-character-avatar').first().boundingBox();
  assert.ok(filter && list && filter.x + filter.width <= list.x, 'filters sit beside character cards');
  assert.ok(avatar && avatar.width >= 64, 'portraits are large enough to browse');
});

test('mobile workspace presents the board before its supporting settings', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  const board = await page.locator('.taste-board').boundingBox();
  const controls = await page.locator('.taste-controls').boundingBox();
  assert.ok(board && controls && board.y < controls.y, 'board precedes settings');
  assert.ok(board.y < 844, 'board appears in the initial viewport');
});

test('character selection supports group filtering, empty results and keyboard dismissal', async t => {
  const page = await pageFor(t);
  const cell = page.locator('.taste-board-cell').first();
  await cell.click();
  const dialog = page.getByRole('dialog', { name: '캐릭터 선택' });
  await page.getByLabel('작품 분류').selectOption({ label: '동방홍마향' });
  assert.equal(await characterButton(dialog, '하쿠레이 레이무').count(), 1);
  await page.getByLabel('캐릭터 검색').fill('no-such-character-xyz');
  assert.equal(await dialog.getByText('검색 결과가 없습니다.').count(), 1);
  await page.getByLabel('캐릭터 검색').fill('');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await cell.evaluate(el => document.activeElement === el), true);
});

test('taste board offers editable grid presets and keeps empty positions', async t => {
  const page = await pageFor(t);
  await page.getByRole('heading', { level: 1, name: '캐릭터 취향 모음표' }).waitFor();
  assert.equal(await page.locator('.taste-board-cell').count(), 9);
  await page.getByRole('button', { name: '한 줄 · 3칸' }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 3);
  await page.locator('.taste-board-cell').nth(1).click();
  await characterButton(page, '하쿠레이 레이무').click();
  assert.equal(await page.locator('.taste-board-cell').count(), 3);
  assert.equal(await page.locator('.taste-board-cell').nth(0).getAttribute('data-empty'), 'true');
  assert.equal(await page.locator('.taste-board-cell').nth(1).getAttribute('data-empty'), 'false');
  await page.reload();
  await page.locator('.taste-board-cell').first().waitFor();
  assert.equal(await page.locator('.taste-board-cell').count(), 3);
  assert.equal(await page.locator('.taste-board-cell').nth(1).getAttribute('data-empty'), 'false');
  await page.locator('.taste-custom-grid summary').click();
  await page.getByLabel('행 수').selectOption('2');
  await page.getByLabel('열 수').selectOption('5');
  assert.equal(await page.locator('.taste-board-cell').count(), 10);
});

test('taste board supports groups and independent visual themes on a mobile viewport', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  await addEmptyGroup(page);
  assert.equal(await page.locator('.taste-board-group').count(), 2);
  await page.getByLabel('그룹 이름').nth(1).fill('작품별 분류');
  assert.equal(await page.getByLabel('그룹 이름').nth(1).inputValue(), '작품별 분류');
  await page.getByRole('button', { name: '나이트' }).click();
  assert.equal(await page.locator('.taste-board').getAttribute('data-theme'), 'night');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false);
});

test('custom grid controls expand above the board instead of covering cells on mobile', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  await page.locator('.taste-custom-grid summary').click();
  const lastControl = await page.locator('.taste-custom-grid-fields > label').last().boundingBox();
  const grid = await page.locator('.taste-board-grid').first().boundingBox();
  assert.ok(lastControl && grid && lastControl.y + lastControl.height <= grid.y, 'custom controls must take space before the character grid');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'custom controls must not cause horizontal page overflow');
});

test('clearing characters requires confirmation, preserves board settings and can be undone', async t => {
  const page = await pageFor(t);
  await page.getByLabel('모음표 제목').fill('내 모음표');
  await page.getByRole('button', { name: '나이트' }).click();
  await page.locator('.taste-board-cell').first().click();
  await characterButton(page, '하쿠레이 레이무').click();
  await addEmptyGroup(page);
  await page.locator('.taste-board-group').nth(1).locator('.taste-board-cell').first().click();
  await characterButton(page, '키리사메 마리사').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: '캐릭터 초기화' }).click();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 2);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '캐릭터 초기화' }).click();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 0);
  assert.equal(await page.getByLabel('모음표 제목').inputValue(), '내 모음표');
  assert.equal(await page.locator('.taste-board').getAttribute('data-theme'), 'night');
  assert.equal(await page.locator('.taste-board-group').count(), 2);
  await page.reload();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 0);
});

test('clearing characters is undoable', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').first().click();
  await characterButton(page, '하쿠레이 레이무').click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '캐릭터 초기화' }).click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.taste-board-cell[data-empty="false"]').count(), 1);
});

test('shrinking a populated grid requires confirmation and can be cancelled without data loss', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').nth(8).click();
  await characterButton(page, '하쿠레이 레이무').click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: '한 줄 · 3칸' }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 9);
  assert.equal(await page.locator('.taste-board-cell').nth(8).getAttribute('data-empty'), 'false');
});

test('a cell image is stored separately and restored after reload', async t => {
  const page = await pageFor(t);
  const image = new PNG({ width: 1, height: 1 });
  image.data = Buffer.from([120, 80, 200, 255]);
  await page.locator('.taste-board-cell').first().click();
  await characterButton(page, '하쿠레이 레이무').click();
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '사진 업로드' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'custom.png',
    mimeType: 'image/png',
    buffer: PNG.sync.write(image),
  });
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
  await page.locator('[role="dialog"] footer').getByText('완료').click();
  await page.reload();
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
  const imageId = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'));
    return saved.data.groups[0].cells[0].imageId;
  });
  assert.ok(imageId);
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '사진 제거' }).click();
  await page.locator('[role="dialog"] footer').getByText('완료').click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
});


test('appearance filters match role and stage within the same work', async t => {
  const page = await pageFor(t);
  const dialog = await openGroupDialog(page, 'collect');
  await dialog.getByText('상세 조건', { exact: true }).click();
  const topic = dialog.locator('.taste-group-dialog-controls > label select').nth(1);
  const role = dialog.locator('.taste-group-dialog-controls > label select').nth(2);
  const stage = dialog.locator('details select');
  await stage.selectOption('1');
  await role.selectOption('boss');
  await topic.selectOption('th6');
  assert.equal(await characterButton(dialog, '루미아').count(), 1);
  assert.equal(await characterButton(dialog, '치르노').count(), 0);
  await topic.selectOption('th11');
  assert.equal(await characterButton(dialog, '쿠로다니 야마메').count(), 1);
  assert.equal(await characterButton(dialog, '키스메').count(), 0);
  await role.selectOption('midboss');
  assert.equal(await characterButton(dialog, '키스메').count(), 1);
  await topic.selectOption('th12');
  await stage.selectOption('5');
  await role.selectOption('boss');
  assert.equal(await characterButton(dialog, '나즈린').count(), 0);
  await role.selectOption('midboss');
  assert.equal(await characterButton(dialog, '나즈린').count(), 1);
  await topic.selectOption('th7');
  await stage.selectOption('');
  await role.selectOption('playable');
  assert.equal(await characterButton(dialog, '이자요이 사쿠야').count(), 1);
  assert.equal(await dialog.getByText('확인된 출연 정보를 기준으로 필터링합니다.').count(), 1);
  await topic.selectOption('');
  await role.selectOption('');
  assert.equal(await characterButton(dialog, '선대 무녀').count(), 1);
  assert.equal(await characterButton(dialog, '라이카').count(), 1);
});

test('favorites, first-stage bosses and a free group coexist, undo and reload', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').first().click();
  await characterButton(page, '하쿠레이 레이무').click();
  let dialog = await openGroupDialog(page);
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  const favorites = page.locator('.taste-board-group').nth(1);
  assert.equal(await favorites.locator('.taste-board-cell').count(), 20);
  for (const work of ['동방홍마향', '동방요요몽']) {
    const cell = favorites.locator('.taste-board-cell').filter({ hasText: work });
    await cell.click();
    const picker = page.getByRole('dialog', { name: '캐릭터 선택' });
    assert.equal(await picker.getByLabel('작품 분류').inputValue(), work === '동방홍마향' ? 'th6' : 'th7');
    const sakuyaCard = characterButton(picker, '이자요이 사쿠야');
    assert.match(await sakuyaCard.innerText(), work === '동방홍마향' ? /5면 보스/ : /플레이어/);
    await characterButton(picker, '이자요이 사쿠야').click();
    assert.equal(await cell.getAttribute('data-empty'), 'false');
    assert.match(await cell.innerText(), new RegExp(`${work} 버전`));
  }
  await favorites.getByLabel('출연 정보 표시').check();
  assert.match(await favorites.locator('.taste-board-cell').filter({ hasText: '동방홍마향' }).innerText(), /5면 보스/);
  assert.match(await favorites.locator('.taste-board-cell').filter({ hasText: '동방요요몽' }).innerText(), /플레이어/);
  dialog = await openGroupDialog(page, 'collect');
  await dialog.getByRole('button', { name: '1면 보스', exact: true }).click();
  assert.equal(await dialog.getByLabel('그룹 이름').inputValue(), '1면 보스 모음');
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).click();
  await dialog.waitFor({ state: 'detached' });
  const bosses = page.locator('.taste-board-group').nth(2);
  assert.equal(await bosses.locator('.taste-board-cell[data-empty="false"]').count(), 16);
  await addEmptyGroup(page);
  assert.equal(await page.locator('.taste-board-group').count(), 4);
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 3);
  await addEmptyGroup(page);
  const free = page.locator('.taste-board-group').nth(3);
  for (const [index, name] of ['선대 무녀', '라이카'].entries()) {
    await free.locator('.taste-board-cell').nth(index).click();
    await characterButton(page.getByRole('dialog', { name: '캐릭터 선택' }), name).click();
  }
  const beforeReload = await savedBoard(page);
  assert.equal(beforeReload.groups[0].title, 'Favorites');
  assert.deepEqual(beforeReload.groups[0].cells[0].characters, ['reimu']);
  await page.reload();
  assert.deepEqual(await savedBoard(page), beforeReload);
  assert.equal(await page.locator('.taste-board-group').count(), 4);
  for (const work of ['동방홍마향', '동방요요몽']) {
    assert.equal(await page.locator('.taste-board-group').nth(1).locator('.taste-board-cell').filter({ hasText: work }).getAttribute('data-empty'), 'false');
  }
  assert.equal(await page.locator('.taste-board-group').nth(2).locator('.taste-board-cell[data-empty="false"]').count(), 16);
  assert.equal(await page.locator('.taste-board-group').nth(3).locator('.taste-board-cell[data-empty="false"]').count(), 2);
});

test('favorite work versions stay independent per character and survive edits and reload', async t => {
  const page = await pageFor(t);
  const cell = page.locator('.taste-board-cell').first();
  await cell.click();
  await characterButton(page, '하쿠레이 레이무').click();
  await cell.click();
  let dialog = page.getByRole('dialog', { name: '캐릭터 선택' });
  await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('th18');
  await dialog.getByRole('button', { name: '한 명 더 담기' }).click();
  await characterButton(dialog, '키리사메 마리사').click();
  await cell.click();
  dialog = page.getByRole('dialog', { name: '캐릭터 선택' });
  await dialog.getByLabel('키리사메 마리사 좋아하는 버전').selectOption('th7');
  await dialog.getByRole('button', { name: '완료', exact: true }).last().click();
  assert.match(await cell.innerText(), /하쿠레이 레이무[\s\S]*동방홍룡동 버전[\s\S]*키리사메 마리사[\s\S]*동방요요몽 버전/);
  await page.reload();
  await cell.waitFor();
  assert.match(await cell.innerText(), /동방홍룡동 버전/);
  await cell.click();
  dialog = page.getByRole('dialog', { name: '캐릭터 선택' });
  assert.equal(await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').inputValue(), 'th18');
  assert.equal(await dialog.getByLabel('키리사메 마리사 좋아하는 버전').inputValue(), 'th7');
  await characterButton(dialog, '루미아').click();
  const replaced = (await savedBoard(page)).groups[0].cells[0];
  assert.deepEqual(replaced.characters, ['rumia']);
  assert.deepEqual(replaced.versionWorkIds, {});
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.match(await cell.innerText(), /동방홍룡동 버전/);
  assert.match(await cell.innerText(), /동방요요몽 버전/);
});

test('labeled empty slots survive a cancelled shrink and undo', async t => {
  const page = await pageFor(t);
  const dialog = await openGroupDialog(page);
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  const group = page.locator('.taste-board-group').nth(1);
  const original = (await savedBoard(page)).groups[1];
  page.once('dialog', prompt => prompt.dismiss());
  await group.getByRole('button', { name: '한 줄 · 3칸' }).click();
  assert.deepEqual((await savedBoard(page)).groups[1], original);
  page.once('dialog', prompt => prompt.accept());
  await group.getByRole('button', { name: '한 줄 · 3칸' }).click();
  assert.equal(await group.locator('.taste-board-cell').count(), 3);
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.deepEqual((await savedBoard(page)).groups[1], original);
});

test('filtering and appearance details preserve the board and pending selection', async t => {
  const page = await pageFor(t);
  const before = await savedBoard(page);
  const dialog = await openGroupDialog(page, 'collect');
  await dialog.locator('.taste-group-dialog-controls > label select').nth(1).selectOption('th6');
  const sakuya = characterButton(dialog, '이자요이 사쿠야');
  await sakuya.click();
  const info = dialog.getByRole('button', { name: '이자요이 사쿠야 출연 정보' });
  await info.click();
  assert.equal(await info.getAttribute('aria-expanded'), 'true');
  const detail = dialog.locator('.taste-character-details');
  assert.equal(await detail.count(), 1);
  assert.match(await detail.innerText(), /동방홍마향/);
  assert.match(await detail.innerText(), /동방요요몽/);
  assert.match(await detail.innerText(), /플레이어/);
  assert.ok(await detail.locator('a[href^="https://"]').count() > 0);
  await detail.getByRole('button', { name: '닫기' }).click();
  assert.equal(await info.evaluate(el => document.activeElement === el), true);
  assert.equal(await sakuya.getAttribute('aria-pressed'), 'true');
  await dialog.locator('.taste-group-dialog-controls > label select').nth(1).selectOption('th7');
  assert.equal(await characterButton(dialog, '이자요이 사쿠야').getAttribute('aria-pressed'), 'true');
  await dialog.getByLabel('이름 검색').fill('이자요이 사쿠야');
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  assert.match(await dialog.locator('.taste-group-selection-actions').innerText(), /1\s*명 선택/);
  assert.deepEqual(await savedBoard(page), before);
  await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).click();
  assert.equal(await page.locator('.taste-board-group').nth(1).locator('.taste-board-cell[data-empty="false"]').count(), 1);
});

test('group creation rejects empty inputs and capacity limits without modifying the board', async t => {
  const page = await pageFor(t);
  const before = await savedBoard(page);
  let dialog = await openGroupDialog(page);
  const create = dialog.getByRole('button', { name: '그룹 추가', exact: true });
  await dialog.getByLabel('그룹 이름').fill('');
  assert.equal(await create.isDisabled(), true);
  assert.equal(await dialog.getByText('그룹 이름을 입력하세요.').count(), 1);
  await dialog.getByLabel('그룹 이름').fill('최애');
  while (await dialog.locator('.taste-group-topics input:checked').count()) await dialog.locator('.taste-group-topics input:checked').first().uncheck();
  assert.equal(await create.isDisabled(), true);
  assert.equal(await dialog.getByText('주제를 하나 이상 선택하세요.').count(), 1);
  await dialog.getByLabel('추가 방식').selectOption('collect');
  assert.equal(await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).isDisabled(), true);
  assert.equal(await dialog.getByText('인물을 한 명 이상 선택하세요.').count(), 1);
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  assert.equal(await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).isDisabled(), true);
  assert.match(await dialog.locator('footer').innerText(), /필요한 칸/);
  await dialog.getByRole('button', { name: '선택 해제' }).click();
  assert.match(await dialog.locator('.taste-group-selection-actions').innerText(), /0\s*명 선택/);
  await dialog.getByRole('button', { name: '닫기', exact: true }).last().click();
  assert.deepEqual(await savedBoard(page), before);

  const group = (id, count) => ({ id, title: id, rows: count / 10, columns: 10, cells: Array(count).fill(null) });
  const seeded = { ...before, groups: [group('a', 100), group('b', 100), group('c', 90)] };
  await page.evaluate(data => localStorage.setItem('introduce:characters:taste-board:v1', JSON.stringify({ version: 1, data })), seeded);
  await page.reload();
  dialog = await openGroupDialog(page);
  assert.equal(await dialog.getByRole('button', { name: '그룹 추가', exact: true }).isDisabled(), true);
  assert.match(await dialog.locator('footer').innerText(), /필요한 칸/);
  await dialog.getByRole('button', { name: '닫기', exact: true }).last().click();
  assert.deepEqual(await savedBoard(page), seeded);

  const full = { ...before, groups: Array.from({ length: 20 }, (_, index) => ({ id: `g${index}`, title: `g${index}`, rows: 1, columns: 1, cells: [null] })) };
  await page.evaluate(data => localStorage.setItem('introduce:characters:taste-board:v1', JSON.stringify({ version: 1, data })), full);
  await page.reload();
  assert.equal(await page.getByRole('button', { name: '그룹 추가', exact: true }).isDisabled(), true);
  assert.deepEqual(await savedBoard(page), full);
});

test('grid editing and character dialog stay usable without horizontal overflow at mobile, tablet, and desktop widths', async t => {
  for (const width of [360, 390, 430, 768, 1440]) {
    const context = await browser.newContext({ locale: 'ko-KR', viewport: { width, height: 844 }, hasTouch: width <= 390, isMobile: width <= 390 });
    t.after(() => context.close());
    const page = await context.newPage();
    await page.goto(`${base}/characters/tastes`);
    await page.getByRole('button', { name: '5 × 5' }).click();
    assert.equal(await page.locator('.taste-board-cell').count(), 25);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px layout has no horizontal overflow`);
    await page.locator('.taste-board-cell').last().click();
    const dialog = await page.locator('[role="dialog"]').boundingBox();
    assert.ok(dialog && dialog.x >= 0 && dialog.x + dialog.width <= width && dialog.y >= 0 && dialog.y + dialog.height <= 844, `${width}px character picker fits the viewport`);
    await characterButton(page, '하쿠레이 레이무').click();
    assert.equal(await page.locator('.taste-board-cell').last().getAttribute('data-empty'), 'false');
  }
});
