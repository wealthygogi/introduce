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
