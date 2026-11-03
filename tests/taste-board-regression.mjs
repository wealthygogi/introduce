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

async function pageFor(t, route = '/characters/tastes', viewport = { width: 1280, height: 900 }, start = true) {
  const context = await browser.newContext({ locale: 'ko-KR', viewport });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(`${base}${route}`);
  if (start) {
    const dialog = page.getByRole('dialog', { name: '그룹 추가' });
    await dialog.getByRole('button', { name: '자유 그룹' }).click();
    await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
  }
  return page;
}

async function openGroupDialog(page, mode = 'favorites') {
  await page.getByRole('button', { name: '그룹 추가', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  const modes = { favorites: '작품별 최애', collect: '조건별 모음', empty: '자유 그룹' };
  await dialog.getByRole('button', { name: modes[mode], exact: true }).click();
  return dialog;
}

async function addEmptyGroup(page) {
  const dialog = await openGroupDialog(page, 'empty');
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
}

const characterButton = (container, name) => container.locator('.taste-character-list').getByRole('button', { name, exact: true });

async function savedBoard(page) {
  await page.waitForFunction(() => localStorage.getItem('introduce:characters:taste-board:v1') !== null);
  return page.evaluate(() => JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1')).data);
}

test('deleting the last group leaves an add-group action and can add a group again', async t => {
  const page = await pageFor(t);
  await page.getByRole('button', { name: '그룹 삭제' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 0);
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 1);
  await page.getByRole('button', { name: '그룹 삭제' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 0);
  assert.deepEqual((await savedBoard(page)).groups, []);
  const addGroup = page.locator('.taste-add-group');
  await addGroup.waitFor();
  await page.reload();
  await page.locator('.taste-board').waitFor();
  assert.equal(await page.locator('.taste-board-group').count(), 0);
  await page.locator('.taste-add-group').waitFor();
  assert.equal(await page.locator('.taste-add-group').isVisible(), true);
  await page.locator('.taste-add-group').click();
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  await dialog.getByRole('button', { name: '자유 그룹' }).click();
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.locator('.taste-board-group').count(), 1);
  assert.equal((await savedBoard(page)).groups.length, 1);
});

test('a new board starts with the selected size and restores it on reload', async t => {
  const page = await pageFor(t, '/characters/tastes', undefined, false);
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  await dialog.waitFor();
  assert.equal(await page.locator('.taste-board-cell').count(), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1')), null);
  await dialog.getByRole('button', { name: '자유 그룹' }).click();
  await dialog.getByRole('button', { name: '4 × 4', exact: true }).click();
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 16);
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'));
    return saved?.data.groups[0].rows === 4 && saved.data.groups[0].columns === 4;
  });
  await page.reload();
  await page.locator('.taste-board-cell').first().waitFor();
  assert.equal(await page.getByRole('dialog', { name: '그룹 추가' }).count(), 0);
  assert.equal(await page.locator('.taste-board-cell').count(), 16);
});

test('starting with work favorites creates only the selected work group', async t => {
  const page = await pageFor(t, '/characters/tastes', undefined, false);
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  await dialog.getByRole('button', { name: '작품별 최애', exact: true }).click();
  while (await dialog.locator('.taste-group-topics input:checked').count()) await dialog.locator('.taste-group-topics input:checked').first().uncheck();
  await dialog.getByLabel('동방홍마향', { exact: true }).check();
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.locator('.taste-board-group').count(), 1);
  assert.match(await page.locator('.taste-board-group').first().innerText(), /동방홍마향/);
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'));
    return saved?.data.groups.length === 1 && saved.data.groups[0].slots?.some(slot => slot?.topicId === 'th6');
  });
  const board = await savedBoard(page);
  assert.notEqual(board.groups[0].title, 'Favorites');
  assert.deepEqual(board.groups[0].slots.filter(Boolean).map(slot => slot.topicId), ['th6']);
  await page.reload();
  await page.locator('.taste-board-group').first().waitFor();
  assert.equal(await page.getByRole('dialog', { name: '그룹 추가' }).count(), 0);
  assert.deepEqual(await savedBoard(page), board);
});

test('cancelling or reloading the initial choices does not save a board', async t => {
  const page = await pageFor(t, '/characters/tastes', undefined, false);
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  await dialog.getByRole('button', { name: '자유 그룹' }).click();
  await dialog.getByRole('button', { name: '4 × 4', exact: true }).click();
  await page.reload();
  await dialog.waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1')), null);
  await dialog.getByRole('button', { name: '작품별 최애' }).click();
  await dialog.getByLabel('동방홍마향', { exact: true }).uncheck();
  await dialog.getByRole('button', { name: '닫기', exact: true }).last().click();
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1')), null);
  await page.reload();
  await dialog.waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1')), null);
});

test('starting another board preserves the current draft until confirmed and allows undo', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').first().click();
  await characterButton(page, '카기야마 히나').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'))?.data.groups[0].cells[0]?.characters[0] === 'hina');
  const original = await savedBoard(page);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: '새 표 만들기' }).click();
  assert.deepEqual(await savedBoard(page), original);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '새 표 만들기' }).click();
  assert.deepEqual(await savedBoard(page), original);
  await page.getByRole('dialog', { name: '그룹 추가' }).getByRole('button', { name: '닫기', exact: true }).last().click();
  assert.match(await page.locator('.taste-board-cell').first().innerText(), /카기야마 히나/);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '새 표 만들기' }).click();
  const dialog = page.getByRole('dialog', { name: '그룹 추가' });
  await dialog.getByRole('button', { name: '자유 그룹' }).click();
  await dialog.getByText('직접 선택', { exact: true }).click();
  await dialog.getByLabel('행 수').selectOption('2');
  await dialog.getByLabel('열 수').selectOption('4');
  await dialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  assert.equal(await page.locator('.taste-board-cell').count(), 8);
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.match(await page.locator('.taste-board-cell').first().innerText(), /카기야마 히나/);
});

test('desktop taste picker shows large portrait cards beside its filters', async t => {
  const page = await pageFor(t);
  await page.locator('.taste-board-cell').first().click();
  const dialog = page.locator('.taste-cell-dialog');
  const filter = await dialog.getByLabel('작품 / 분류').boundingBox();
  const list = await dialog.locator('.taste-character-list').boundingBox();
  const avatar = await dialog.locator('.taste-character-avatar').first().boundingBox();
  assert.ok(filter && list && filter.y + filter.height <= list.y, 'filters appear before character results');
  assert.ok(avatar && avatar.width >= 32, 'character portraits remain visible');
});

test('mobile workspace presents the board before its supporting settings', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  const board = await page.locator('.taste-board').boundingBox();
  const controls = await page.locator('.taste-controls').boundingBox();
  assert.ok(board && controls && board.y < controls.y, 'board precedes settings');
  assert.ok(board.y < 844, 'board appears in the initial viewport');
});

test('mobile dense grids keep character names readable without page overflow', async t => {
  const page = await pageFor(t, '/characters/tastes', { width: 390, height: 844 });
  await page.getByRole('button', { name: '5 × 5' }).click();
  await page.locator('.taste-board-cell').first().click();
  await characterButton(page, '카기야마 히나').click();
  const name = page.locator('.taste-character').first().locator('span').last();
  assert.equal(await name.evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects().length;
  }), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await page.locator('.taste-board-grid').evaluate(element => element.scrollWidth > element.clientWidth), true);
});

test('character selection supports group filtering, empty results and keyboard dismissal', async t => {
  const page = await pageFor(t);
  const cell = page.locator('.taste-board-cell').first();
  await cell.click();
  const dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('작품 / 분류').selectOption({ label: '동방홍마향' });
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
  await page.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('th18');
  await page.getByRole('button', { name: '사진 업로드' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'custom.png',
    mimeType: 'image/png',
    buffer: PNG.sync.write(image),
  });
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
  await page.locator('[role="dialog"] footer').getByText('완료').click();
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'));
    const cell = saved?.data.groups[0].cells[0];
    return cell?.imageId && cell.versionWorkIds?.reimu === 'th18';
  });
  await page.reload();
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
  assert.equal(await page.getByRole('heading', { name: '어떻게 시작할까요?' }).count(), 0);
  assert.match(await page.locator('.taste-board-cell').first().innerText(), /동방홍룡동 버전/);
  const imageId = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1'));
    return saved.data.groups[0].cells[0].imageId;
  });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:characters:taste-board:v1')).version), 1);
  const restored = await savedBoard(page);
  assert.deepEqual(restored.groups[0].cells[0].characters, ['reimu']);
  assert.equal(restored.groups[0].cells[0].versionWorkIds.reimu, 'th18');
  assert.ok(imageId);
  await page.locator('.taste-board-cell').first().click();
  await page.getByRole('button', { name: '사진 제거' }).click();
  await page.locator('[role="dialog"] footer').getByText('완료').click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  await page.locator('.taste-character-avatar img[src^="blob:"]').first().waitFor();
});


test('criteria combine a work, role and stage on the same game record', async t => {
  const page = await pageFor(t);
  const dialog = await openGroupDialog(page, 'collect');
  const next = () => dialog.getByRole('button', { name: '인물 선택으로' }).click();
  const back = () => dialog.getByRole('button', { name: '그룹 설정으로' }).click();
  await dialog.getByLabel('작품 범위').selectOption('mainline');
  assert.equal(await dialog.getByLabel('스테이지').isDisabled(), true);
  await dialog.getByLabel('동방홍마향', { exact: true }).check();
  await dialog.getByLabel('보스', { exact: true }).check();
  await dialog.getByLabel('스테이지').selectOption('1');
  await next();
  assert.equal(await characterButton(dialog, '루미아').count(), 1);
  assert.equal(await characterButton(dialog, '치르노').count(), 0);
  assert.equal(await characterButton(dialog, '플랑드르 스칼렛').count(), 0);
  await back();
  await dialog.getByLabel('동방홍마향', { exact: true }).uncheck();
  await dialog.getByLabel('동방지령전', { exact: true }).check();
  await next();
  assert.equal(await characterButton(dialog, '쿠로다니 야마메').count(), 1);
  assert.equal(await characterButton(dialog, '키스메').count(), 0);
  await back();
  await dialog.getByLabel('보스', { exact: true }).uncheck();
  await dialog.getByLabel('중보스', { exact: true }).check();
  await next();
  assert.equal(await characterButton(dialog, '키스메').count(), 1);
  await back();
  await dialog.getByLabel('동방지령전', { exact: true }).uncheck();
  await dialog.getByLabel('동방성련선', { exact: true }).check();
  await dialog.getByLabel('스테이지').selectOption('5');
  await next();
  assert.equal(await characterButton(dialog, '나즈린').count(), 1);
  await back();
  await dialog.getByLabel('중보스', { exact: true }).uncheck();
  await dialog.getByLabel('플레이어', { exact: true }).check();
  assert.equal(await dialog.getByLabel('스테이지').isDisabled(), true);
});

test('multiple works and final stages combine, and incomplete book candidates remain manually expandable', async t => {
  const page = await pageFor(t);
  const dialog = await openGroupDialog(page, 'collect');
  await dialog.getByLabel('작품 범위').selectOption('mainline');
  await dialog.getByLabel('동방홍마향', { exact: true }).check();
  await dialog.getByLabel('동방요요몽', { exact: true }).check();
  await dialog.getByLabel('보스', { exact: true }).check();
  await dialog.getByLabel('스테이지').selectOption('6');
  await dialog.getByRole('button', { name: '인물 선택으로' }).click();
  assert.equal(await characterButton(dialog, '레밀리아 스칼렛').count(), 1);
  assert.equal(await characterButton(dialog, '사이교우지 유유코').count(), 1);
  assert.equal(await characterButton(dialog, '플랑드르 스칼렛').count(), 0);
  await dialog.getByRole('button', { name: '그룹 설정으로' }).click();
  await dialog.getByLabel('작품 범위').selectOption('books');
  assert.equal(await dialog.getByLabel('스테이지').isDisabled(), true);
  await dialog.getByLabel('동방영나암', { exact: true }).check();
  await dialog.getByRole('button', { name: '인물 선택으로' }).click();
  assert.equal(await characterButton(dialog, '모토오리 코스즈').count(), 1);
  assert.match(await dialog.innerText(), /서적 관련 후보\(언급 포함\), 불완전/);
  await dialog.getByRole('button', { name: '전체 인물에서 직접 추가' }).click();
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
    const picker = page.locator('.taste-cell-dialog');
    assert.equal(await picker.getByLabel('작품 / 분류').inputValue(), work === '동방홍마향' ? 'th6' : 'th7');
    await characterButton(picker, '이자요이 사쿠야').click();
    assert.equal(await cell.getAttribute('data-empty'), 'false');
    assert.match(await cell.innerText(), new RegExp(`${work} 버전`));
  }
  dialog = await openGroupDialog(page, 'collect');
  await dialog.getByLabel('작품 범위').selectOption('mainline');
  await dialog.getByLabel('보스', { exact: true }).check();
  await dialog.getByLabel('스테이지').selectOption('1');
  await dialog.getByRole('button', { name: '인물 선택으로' }).click();
  assert.equal(await characterButton(dialog, '루미아').count(), 1);
  assert.equal(await characterButton(dialog, '쿠로다니 야마메').count(), 1);
  assert.equal(await characterButton(dialog, '플랑드르 스칼렛').count(), 0);
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).click();
  await dialog.waitFor({ state: 'detached' });
  const bosses = page.locator('.taste-board-group').nth(2);
  assert.match(await bosses.innerText(), /루미아/);
  assert.match(await bosses.innerText(), /쿠로다니 야마메/);
  await addEmptyGroup(page);
  assert.equal(await page.locator('.taste-board-group').count(), 4);
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.equal(await page.locator('.taste-board-group').count(), 3);
  await addEmptyGroup(page);
  const free = page.locator('.taste-board-group').nth(3);
  for (const [index, name] of ['선대 무녀', '라이카'].entries()) {
    await free.locator('.taste-board-cell').nth(index).click();
    await characterButton(page.locator('.taste-cell-dialog'), name).click();
  }
  const beforeReload = await savedBoard(page);
  assert.equal(beforeReload.groups[0].title, '내 그룹 1');
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
  let dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('th18');
  await dialog.getByRole('button', { name: '한 명 더 담기' }).click();
  await characterButton(dialog, '키리사메 마리사').click();
  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('키리사메 마리사 좋아하는 버전').selectOption('th7');
  await dialog.getByRole('button', { name: '완료', exact: true }).last().click();
  assert.match(await cell.innerText(), /하쿠레이 레이무[\s\S]*동방홍룡동 버전[\s\S]*키리사메 마리사[\s\S]*동방요요몽 버전/);
  await page.reload();
  await cell.waitFor();
  assert.match(await cell.innerText(), /동방홍룡동 버전/);
  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  assert.equal(await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').inputValue(), 'th18');
  assert.equal(await dialog.getByLabel('키리사메 마리사 좋아하는 버전').inputValue(), 'th7');
  await dialog.getByRole('button', { name: '캐릭터 바꾸기' }).click();
  await characterButton(dialog, '루미아').click();
  const replaced = (await savedBoard(page)).groups[0].cells[0];
  assert.deepEqual(replaced.characters, ['rumia']);
  assert.deepEqual(replaced.versionWorkIds, {});
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.match(await cell.innerText(), /동방홍룡동 버전/);
  assert.match(await cell.innerText(), /동방요요몽 버전/);
});
test('search filters never mutate saved versions and free cells do not infer versions', async t => {
  const page = await pageFor(t);
  const cell = page.locator('.taste-board-cell').first();
  await cell.click();
  let dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('작품 / 분류').selectOption('th18');
  const beforeSelection = await savedBoard(page);
  await characterButton(dialog, '하쿠레이 레이무').click();
  const chosen = (await savedBoard(page)).groups[0].cells[0];
  assert.deepEqual(chosen.characters, ['reimu']);
  assert.deepEqual(chosen.versionWorkIds ?? {}, {});
  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('th7');
  await dialog.getByRole('button', { name: '완료', exact: true }).click();
  assert.equal((await savedBoard(page)).groups[0].cells[0].versionWorkIds.reimu, 'th7');

  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  await dialog.getByRole('button', { name: '캐릭터 바꾸기' }).click();
  await dialog.getByLabel('작품 / 분류').selectOption('th18');
  assert.equal((await savedBoard(page)).groups[0].cells[0].versionWorkIds.reimu, 'th7');
  await dialog.getByRole('button', { name: '칸 편집으로' }).click();
  assert.equal(await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').inputValue(), 'th7');
  await dialog.getByRole('button', { name: '완료', exact: true }).click();
  await page.reload();
  assert.deepEqual((await savedBoard(page)).groups[0].cells[0].versionWorkIds, { reimu: 'th7' });
  assert.equal(beforeSelection.groups[0].cells[0], null);
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

test('group selection keeps its chosen work and pending selection across filter changes', async t => {
  const page = await pageFor(t);
  const before = await savedBoard(page);
  const dialog = await openGroupDialog(page, 'collect');
  await dialog.getByLabel('동방홍마향', { exact: true }).check();
  await dialog.getByRole('button', { name: '인물 선택으로' }).click();
  const sakuya = characterButton(dialog, '이자요이 사쿠야');
  await sakuya.click();
  assert.equal(await sakuya.getAttribute('aria-pressed'), 'true');
  await dialog.getByRole('button', { name: '그룹 설정으로' }).click();
  await dialog.getByLabel('동방홍마향', { exact: true }).uncheck();
  await dialog.getByLabel('동방요요몽', { exact: true }).check();
  await dialog.getByRole('button', { name: '인물 선택으로' }).click();
  assert.equal(await characterButton(dialog, '이자요이 사쿠야').getAttribute('aria-pressed'), 'true');
  await dialog.getByLabel('이름 검색').fill('이자요이 사쿠야');
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  await dialog.getByRole('button', { name: '검색 결과 모두 선택' }).click();
  assert.match(await dialog.locator('.taste-group-selection-actions').innerText(), /1\s*명 선택/);
  assert.deepEqual(await savedBoard(page), before);
  await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).click();
  const collected = (await savedBoard(page)).groups[1];
  assert.equal(collected.cells.find(Boolean).versionWorkIds, undefined);
  assert.equal(await page.locator('.taste-board-group').nth(1).locator('.taste-board-cell[data-empty="false"]').count(), 1);
});

test('group creation rejects empty inputs and capacity limits without modifying the board', async t => {
  const page = await pageFor(t);
  const before = await savedBoard(page);
  let dialog = await openGroupDialog(page);
  const create = dialog.getByRole('button', { name: '그룹 추가', exact: true });
  await dialog.getByLabel('그룹 이름').fill('');
  assert.equal(await create.isDisabled(), true);
  assert.equal(await dialog.getByText('그룹 이름을 입력해 주세요.').count(), 1);
  await dialog.getByLabel('그룹 이름').fill('최애');
  while (await dialog.locator('.taste-group-topics input:checked').count()) await dialog.locator('.taste-group-topics input:checked').first().uncheck();
  assert.equal(await create.isDisabled(), true);
  assert.equal(await dialog.getByText('작품이나 분류를 선택해 주세요.').count(), 1);
  await dialog.getByRole('button', { name: '조건별 모음' }).click();
  await dialog.getByRole('button', { name: '인물 선택으로' }).click();
  assert.equal(await dialog.getByRole('button', { name: '선택한 인물로 그룹 추가' }).isDisabled(), true);
  assert.equal(await dialog.getByText('인물을 선택해 주세요.').count(), 1);
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
    const groupDialog = page.getByRole('dialog', { name: '그룹 추가' });
    await groupDialog.getByRole('button', { name: '자유 그룹' }).click();
    await groupDialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
    await page.getByRole('button', { name: '5 × 5' }).click();
    assert.equal(await page.locator('.taste-board-cell').count(), 25);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px layout has no horizontal overflow`);
    await page.locator('.taste-board-cell').last().click();
    const dialog = await page.locator('[role="dialog"]').boundingBox();
    assert.ok(dialog && dialog.x >= 0 && dialog.x + dialog.width <= width && dialog.y >= 0 && dialog.y + dialog.height <= 844, `${width}px character picker fits the viewport`);
    const cell = page.locator('.taste-board-cell').last();
    await characterButton(page, '하쿠레이 레이무').click();
    assert.equal(await cell.getAttribute('data-empty'), 'false');
    await cell.click();
    const editor = page.locator('.taste-cell-dialog');
    assert.ok(await editor.isVisible());
    await editor.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('th18');
    await editor.getByRole('button', { name: '하쿠레이 레이무 버전 해제' }).click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === '하쿠레이 레이무 좋아하는 버전');
    assert.equal(await editor.getByLabel('하쿠레이 레이무 좋아하는 버전').evaluate(element => element === document.activeElement), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `${width}px editor has no horizontal overflow`);
    await page.keyboard.press('Escape');
    assert.equal(await cell.evaluate(element => element === document.activeElement), true, `${width}px Escape restores opener focus`);
  }
});
test('automatic names translate while custom slot text remains fixed and explicit lang URLs stay synchronized', async t => {
  const page = await pageFor(t, '/characters/tastes?lang=ko&probe=keep#board');
  const groupDialog = await openGroupDialog(page, 'favorites');
  while (await groupDialog.locator('.taste-group-topics input:checked').count()) await groupDialog.locator('.taste-group-topics input:checked').first().uncheck();
  await groupDialog.getByLabel('동방홍룡동', { exact: true }).check();
  await groupDialog.getByRole('button', { name: '그룹 추가', exact: true }).click();
  const group = page.locator('.taste-board-group').nth(1);
  const cell = group.locator('.taste-board-cell').first();
  await cell.click();
  const cellDialog = page.locator('.taste-cell-dialog');
  await cellDialog.getByLabel('작품 / 분류').selectOption('th7');
  await characterButton(cellDialog, '하쿠레이 레이무').click();
  const before = await savedBoard(page);
  assert.equal(before.groups[1].titleSource, 'auto');
  assert.equal(before.groups[1].titlePreset.kind, 'favorites');
  assert.equal(before.groups[1].slots[0].labelSource, 'topic');
  assert.equal(before.groups[1].cells[0].versionWorkIds.reimu, 'th18');
  const undoButton = page.locator('.taste-action-group').getByRole('button').nth(1);
  const undoEnabled = await undoButton.isEnabled();

  await cell.click();
  const editor = page.locator('.taste-cell-dialog');
  await editor.locator('.taste-cell-name-details summary').click();
  await editor.getByLabel('칸 이름').fill('temporary custom text');
  await editor.getByLabel('칸 이름').fill('동방홍룡동');
  await editor.getByRole('button', { name: '완료', exact: true }).click();
  const custom = await savedBoard(page);
  assert.equal(custom.groups[1].slots[0].labelSource, 'custom');

  await page.getByRole('button', { name: '日本語', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
  assert.match(page.url(), /lang=ja&probe=keep#board$/);
  assert.equal(await page.title(), '東方 自己紹介 メーカー');
  assert.equal(await page.locator('.taste-board > h2').innerText(), 'お気に入りのキャラクター');
  assert.equal(await group.locator('.taste-group-heading input').inputValue(), '作品別の推し');
  assert.equal(await cell.locator('.taste-slot-label').innerText(), '동방홍룡동');
  assert.equal(await page.getByRole('button', { name: '日本語', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.deepEqual(await savedBoard(page), custom);
  assert.equal(await undoButton.isEnabled(), undoEnabled);

  await cell.click();
  const japaneseEditor = page.locator('.taste-cell-dialog');
  await japaneseEditor.locator('.taste-cell-name-details summary').click();
  await japaneseEditor.getByRole('button', { name: '作品名を使う' }).click();
  assert.equal(await cell.locator('.taste-slot-label').innerText(), '東方虹龍洞');
  await japaneseEditor.getByRole('button', { name: '完了', exact: true }).click();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  assert.equal(await page.title(), 'Touhou Friend Intro Maker');
  assert.equal(await cell.locator('.taste-slot-label').innerText(), 'Unconnected Marketeers');
  assert.equal(await cell.locator('.taste-version-label').innerText(), 'Unconnected Marketeers version');
  await page.getByRole('button', { name: '한국어', exact: true }).click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
  assert.equal(await page.title(), '동방 트친소 메이커');
  assert.equal(await cell.locator('.taste-slot-label').innerText(), '동방홍룡동');
  const freeGroup = page.locator('.taste-board-group').first();
  const lastFreeCell = freeGroup.locator('.taste-board-cell').last();
  await lastFreeCell.click();
  await characterButton(page.locator('.taste-cell-dialog'), '카기야마 히나').click();
  const beforeShrink = await savedBoard(page);
  await page.getByRole('button', { name: '日本語', exact: true }).click();
  let confirmation = '';
  page.once('dialog', async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
  await freeGroup.getByRole('button', { name: '横一列・3マス' }).click();
  assert.equal(confirmation, 'グリッドを小さくすると、一部のキャラクターやマスの名前が削除されます。続けますか？');
  assert.deepEqual(await savedBoard(page), beforeShrink);
  page.once('dialog', dialog => dialog.accept());
  await freeGroup.getByRole('button', { name: '横一列・3マス' }).click();
  assert.equal((await savedBoard(page)).groups[0].cells.length, 3);
  await undoButton.click();
  assert.deepEqual(await savedBoard(page), beforeShrink);
});

test('language selection without a lang query persists without adding one', async t => {
  const page = await pageFor(t, '/characters/tastes?probe=keep#board');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  assert.equal(new URL(page.url()).searchParams.has('lang'), false);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.reload();
  assert.equal(new URL(page.url()).searchParams.has('lang'), false);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.title(), 'Touhou Friend Intro Maker');
});
test('clearing one character version preserves the other and survives search, undo, and reload', async t => {
  const page = await pageFor(t);
  await addEmptyGroup(page);
  const cell = page.locator('.taste-board-group').nth(1).locator('.taste-board-cell').first();
  await cell.click();
  let dialog = page.locator('.taste-cell-dialog');
  await characterButton(dialog, '하쿠레이 레이무').click();
  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('th18');
  await dialog.getByRole('button', { name: '한 명 더 담기' }).click();
  await characterButton(dialog, '키리사메 마리사').click();
  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('키리사메 마리사 좋아하는 버전').selectOption('th7');
  const beforeClear = await savedBoard(page);
  await dialog.getByRole('button', { name: '하쿠레이 레이무 버전 해제' }).click();
  assert.deepEqual((await savedBoard(page)).groups[1].cells[0].versionWorkIds, { marisa: 'th7' });
  await dialog.getByRole('button', { name: '완료', exact: true }).click();
  await page.getByRole('button', { name: '실행 취소' }).click();
  assert.deepEqual((await savedBoard(page)).groups[1].cells[0].versionWorkIds, beforeClear.groups[1].cells[0].versionWorkIds);
  await cell.click();
  dialog = page.locator('.taste-cell-dialog');
  await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').selectOption('');
  assert.deepEqual((await savedBoard(page)).groups[1].cells[0].versionWorkIds, { marisa: 'th7' });
  await dialog.getByRole('button', { name: '캐릭터 바꾸기' }).click();
  await dialog.getByLabel('작품 / 분류').selectOption('th6');
  await dialog.getByRole('button', { name: '칸 편집으로' }).click();
  assert.equal(await dialog.getByLabel('하쿠레이 레이무 좋아하는 버전').inputValue(), '');
  await dialog.getByRole('button', { name: '완료', exact: true }).click();
  await page.reload();
  assert.deepEqual((await savedBoard(page)).groups[1].cells[0].versionWorkIds, { marisa: 'th7' });
});
