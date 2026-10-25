import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const scenarios = [
  { name: 'all', nickname: 'PNG 확인', values: { 'wide:intro': '소개 문장', 'wide:workNote': '대표곡·입덕 계기·좋아하는 부분', 'wide:pairing': '렌코 × 메리', 'wide:freeText': '마지막 줄까지 PNG에 포함합니다.' } },
  { name: 'long', nickname: '장문 확인', values: { 'wide:intro': '한글과 English 그리고 日本語🙂 '.repeat(8), 'wide:workNote': '대표곡·입덕 계기·좋아하는 부분을 기록합니다. '.repeat(8), 'wide:pairing': '렌코 × 메리 '.repeat(9), 'wide:dislike': '서로의 취향을 존중해 주세요. '.repeat(9), 'wide:freeText': '첫 번째 줄입니다.\n마지막 줄도 PNG에 포함합니다. '.repeat(12) } },
];

async function enterWide(page: Page, theme: string) {
  await page.goto(`/introduce/wide/${theme}`);
  await expect(page.locator('#wide-export')).toBeVisible();
}
async function openGroup(page: Page, index: number) {
  const group = page.locator('details.wide-form-group').nth(index);
  if (!(await group.evaluate((element: HTMLDetailsElement) => element.open))) await group.locator('summary').click();
}

async function downloadPng(page: Page, name: string) {
  const box = await page.locator('#wide-export').evaluate((el: HTMLElement) => ({ width: el.offsetWidth, height: el.offsetHeight }));
  const downloadPromise = page.waitForEvent('download');
  await page.locator('.download-btn').click();
  const download = await downloadPromise;
  const path = test.info().outputPath(`${name}.png`);
  await download.saveAs(path);
  const png = await readFile(path);
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe((box.width + 96) * 2);
  expect(Math.abs(png.readUInt32BE(20) - (box.height + 96) * 2)).toBeLessThanOrEqual(4);
  await test.info().attach(`${name}.png`, { path, contentType: 'image/png' });
}

for (const theme of ['paper', 'hifuu']) {
  for (const layout of ['grid', 'row']) {
    for (const scenario of scenarios) {
      test(`${theme}/${layout}/${scenario.name} downloads complete PNG`, async ({ page }) => {
        await enterWide(page, theme);
        await openGroup(page, 1);
        await openGroup(page, 2);
        await openGroup(page, 3);
        await page.locator('#wide-nickname').fill(scenario.nickname);
        for (const [key, value] of Object.entries(scenario.values)) await page.locator(`[id="${key}"]`).fill(value);
        await page.locator(`[data-wide-layout="${layout}"]`).click();
        await expect(page.locator('#wide-export')).toContainText(scenario.nickname);
        await page.screenshot({ path: test.info().outputPath(`${theme}-${layout}-${scenario.name}.png`), fullPage: true });
        await downloadPng(page, `${theme}-${layout}-${scenario.name}-download`);
      });
    }
  }
}

test('full Wide density wraps every field and exports all selected content', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1100 });
  await enterWide(page, 'hifuu');
  for (let index = 1; index < 4; index++) await openGroup(page, index);

  const intro = page.locator('details.wide-form-group').nth(0);
  const accountButtons = intro.locator('.chip-group').nth(0).getByRole('button');
  await expect(accountButtons).toHaveCount(11);
  for (let index = 0; index < 11; index++) {
    const button = accountButtons.nth(index);
    if (await button.getAttribute('aria-pressed') !== 'true') await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await intro.locator('.chip-group').nth(1).getByRole('button').last().click();
  await intro.locator('.chip-group').nth(2).getByRole('button').last().click();
  await intro.locator('details.social-settings summary').click();
  await page.locator('#social-platform').selectOption('other');
  await page.locator('#social-account').fill('https://example.com/full-density');
  await page.locator('input[type="file"]').setInputFiles('public/Touhou 16x16 Mini Pack Full/4. Other/[2] Hifuu Club/Renko Usami.png');

  const workIds = ['th10', 'th12', 'book-b036981ba92d', 'music-352e4ada578a', 'music-11cd7e63b384'];
  await page.locator('[data-work-category="game"]').click();
  for (const id of workIds.slice(0, 2)) await page.locator(`[data-work-choice="${id}"]`).click();
  await page.locator('[data-work-category="book"]').click();
  await page.locator(`[data-work-choice="${workIds[2]}"]`).click();
  await page.locator('[data-work-category="music"]').click();
  for (const id of workIds.slice(3)) await page.locator(`[data-work-choice="${id}"]`).click();
  await page.locator('[data-work-category="all"]').click();

  await page.locator('#wide-character-group').selectOption({ index: 1 });
  const characterIds = ['reimu', 'marisa', 'sanae', 'aya', 'reisen', 'youmu', 'sakuya'];
  for (const id of characterIds) {
    await page.locator('#wide-character-group').selectOption('');
    await page.locator(`[data-character-choice="${id}"]`).click();
  }

  const fieldLimits: Record<string, number> = {
    'wide:handle': 400, 'wide:intro': 400, 'wide:keywords': 400,
    'wide:callname': 400, 'wide:age': 400, 'wide:workNote': 400,
    'wide:characterNote': 400, 'wide:pairing': 100, 'wide:activities': 400,
    'wide:otherGenre': 400, 'wide:dislike': 100, 'wide:boundaryMethod': 400,
    'wide:interaction': 400, 'wide:closing': 400, 'wide:freeText': 300,
  };
  const multilineKeys: Record<string, true> = {
    'wide:intro': true, 'wide:workNote': true, 'wide:characterNote': true,
    'wide:interaction': true, 'wide:freeText': true,
  };
  const values = Object.fromEntries(Object.entries(fieldLimits).map(([key, limit]) => {
    const value = multilineKeys[key]
      ? `${key}${Array.from({ length: limit - key.length }, (_, index) => index % 22 === 21 ? '\n' : '漢').join('')}`
      : key === 'wide:handle' ? 'H'.repeat(limit) : `${key}${'한글English日本語'.repeat(40)}`.slice(0, limit);
    return [key, value];
  })) as Record<string, string>;
  const nickname = page.locator('#wide-nickname');
  await nickname.fill('全入力確認用長文🙂');
  await expect(nickname).toHaveValue('全入力確認用長文🙂');
  await expect.poll(() => nickname.evaluate(element => (element as HTMLInputElement).value.length)).toBe(10);
  for (const [key, value] of Object.entries(values)) {
    const field = page.locator(`[id="${key}"]`);
    await field.fill(value);
    await expect(field).toHaveValue(value);
    await expect.poll(() => field.evaluate(element => (element as HTMLInputElement).maxLength)).toBe(fieldLimits[key]);
    await expect.poll(() => field.evaluate(element => (element as HTMLInputElement).value.length)).toBe(fieldLimits[key]);
    await expect.poll(() => field.evaluate(element => element.tagName === 'TEXTAREA')).toBe(!!multilineKeys[key]);
  }
  await page.locator('details.wide-form-group').nth(3).locator('.chip-group').getByRole('button').last().click();

  const exportRoot = page.locator('#wide-export');
  await expect(exportRoot.locator('.wide-checklist [data-selected="true"]')).toHaveCount(11);
  await expect(exportRoot.locator('[data-ranked-character]')).toHaveCount(7);
  await expect(exportRoot.locator('[data-favorite-work]')).toHaveCount(5);
  await expect(exportRoot.locator('.wide-profile img')).toHaveCount(1);
  await expect(exportRoot.locator('.social-qr-footer')).toHaveCount(1);
  for (const [key, value] of Object.entries(values)) {
    if (key === 'wide:keywords') await expect(exportRoot.locator('.wide-chips')).toContainText('wide:keywords');
    else await expect(exportRoot).toContainText(value);
  }
  await page.screenshot({ path: test.info().outputPath('hifuu-full-density-screen.png'), fullPage: true });
  await downloadPng(page, 'hifuu-full-density');
});

test('Korean labels and names stay together in the posted Wide card layout', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 1100 });
  await enterWide(page, 'paper');
  await page.evaluate(() => localStorage.setItem('introduce:lang', 'ko'));
  await page.reload();
  for (const index of [1, 2, 3]) await openGroup(page, index);

  const basic = page.locator('details.wide-form-group').nth(0);
  for (const label of ['썰', 'RT', '마음', '탐라대화', '앓이']) await basic.locator('.chip').filter({ hasText: label }).first().click();
  await page.locator('#wide-nickname').fill('온리');
  await page.locator('[id="wide:handle"]').fill('@vita_c0de1ia');
  await page.locator('[id="wide:intro"]').fill('축배를 들어라 내가 돌아왔다');

  for (const id of ['th6', 'th11', 'music-11cd7e63b384', 'book-22a4c5f71f5c']) {
    await page.locator(`[data-work-choice="${id}"]`).click();
  }
  await page.locator('[id="wide:workNote"]').fill('Demystify Feast가 최애곡이에요');
  for (const id of ['koishi', 'flandre']) await page.locator(`[data-character-choice="${id}"]`).click();
  await page.locator('[id="wide:pairing"]').fill('♥코이플랑♥ / 레미사토');
  await page.locator('[id="wide:activities"]').fill('일상 올리기');
  await page.locator('[id="wide:dislike"]').fill('근친을 그다지 선호하지 않아요');
  await page.locator('[id="wide:boundaryMethod"]').fill('그래도 꾸역꾸역 먹어봄');
  await page.locator('details.wide-form-group').nth(3).locator('.chip-group').getByRole('button').first().click();

  const lineCount = (selector: string) => page.locator(selector).evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top))).size;
  });
  await expect.poll(() => lineCount('[data-choice-id="rt"] .wide-check-label')).toBe(1);
  for (const selector of [
    '[data-wide-panel="profile"] .wide-profile .wide-detail span',
    '[data-favorite-work="th6"] > span',
    '[data-favorite-work="th11"] > span',
    '[data-favorite-work="music-11cd7e63b384"] > span',
    '[data-favorite-work="book-22a4c5f71f5c"] > span',
    '[data-ranked-character="koishi"] > span',
    '[data-ranked-character="flandre"] > span',
  ]) await expect.poll(() => lineCount(selector)).toBe(1);
  await expect.poll(() => lineCount('.wide-check-block h4 small')).toBe(1);

  await page.screenshot({ path: test.info().outputPath('reported-korean-wrap-screen.png'), fullPage: true });
  await downloadPng(page, 'reported-korean-wrap');
});

test('mobile Wide groups accept text and download the unscaled card', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
    await page.setViewportSize(viewport);
    await enterWide(page, 'paper');
    for (let index = 0; index < 4; index++) {
      const group = page.locator('details.wide-form-group').nth(index);
      if (!(await group.evaluate((element: HTMLDetailsElement) => element.open))) await group.locator('summary').click();
    }
    await page.locator('#wide-nickname').fill('모바일 입력');
    await page.locator('[id="wide:freeText"]').fill('실제 입력 뒤 저장하는 문장');
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', await page.evaluate(() => innerWidth));
    await page.screenshot({ path: test.info().outputPath(`mobile-${viewport.width}.png`), fullPage: true });
    await downloadPng(page, `mobile-${viewport.width}-download`);
  }
});

test('Wide group labels follow the selected language and work titles remain complete', async ({ page }) => {
  await enterWide(page, 'paper');
  for (const [language, labels] of Object.entries({ ko: ['기본 소개', '좋아하는 작품', '캐릭터·커플링', '교류 안내'], ja: ['基本プロフィール', '好きな作品', 'キャラクター・カップリング', '交流について'], en: ['Basic profile', 'Favorite works', 'Characters & pairings', 'Interaction notes'] })) {
    await page.evaluate(lang => localStorage.setItem('introduce:lang', lang), language);
    await page.reload();
    for (const [index, label] of labels.entries()) await expect(page.locator('details.wide-form-group').nth(index).locator(':scope > summary')).toContainText(label);
  }
  await page.evaluate(() => localStorage.setItem('introduce:lang', 'ja'));
  await page.reload();
  await openGroup(page, 1);
  await page.locator('#wide-work-search').fill('大空魔術');
  await page.locator('[data-work-choice="music-11cd7e63b384"]').click();
  await expect(page.locator('#wide-export')).toContainText('大空魔術');
});

test('Wide QR stays in the profile panel and is included in the PNG', async ({ page }) => {
  await enterWide(page, 'paper');
  const socialSettings = page.locator('details.social-settings');
  if (!(await socialSettings.evaluate((element: HTMLDetailsElement) => element.open))) await socialSettings.locator('summary').click();
  await page.locator('#social-platform').selectOption('other');
  await page.locator('#social-account').fill('https://example.com/profile');
  const profile = page.locator('#wide-export [data-wide-panel="profile"]');
  await expect(profile.locator('.social-qr-footer')).toHaveCount(1);
  await expect(page.locator('#wide-export > .social-qr-footer')).toHaveCount(0);
  await downloadPng(page, 'wide-qr-download');
});

test('other-genre frequency marks its group without creating an empty output panel', async ({ page }) => {
  await enterWide(page, 'paper');
  await openGroup(page, 3);
  const group = page.locator('details.wide-form-group').nth(3);
  await group.getByRole('button').nth(2).click();
  await expect(group.locator(':scope > summary')).toContainText('has content');
  await expect(page.locator('#wide-export [data-wide-panel="interaction"]')).toHaveCount(0);
});
