import { test, expect } from '@playwright/test';
import { LIMITS } from '../../src/data/limits';
import { messages } from '../../src/data/i18n';
import { gotoConcept } from './helpers';

/** FormPanel 렌더 순서(닉네임→불호→커플링→자유)가 .form-charcount 인덱스 */
const FIELDS: [selector: string, key: keyof typeof LIMITS, counterIndex: number][] = [
  ['#inp-nickname', 'nickname', 0],
  ['#inp-dislike', 'dislike', 1],
  ['#inp-pairing', 'pairing', 2],
  ['#inp-free', 'freeText', 3],
];

for (const [sel, key, idx] of FIELDS) {
  test(`${key}: 상한 ${LIMITS[key]}자에서 잘리고 카운터가 가득 찬다`, async ({ page }) => {
    await gotoConcept(page, 'p');
    await page.fill(sel, '가'.repeat(LIMITS[key] + 5));
    const v = await page.inputValue(sel);
    expect([...v].length).toBe(LIMITS[key]);
    const counter = page.locator('.form-charcount').nth(idx);
    await expect(counter).toHaveText(`${LIMITS[key]}/${LIMITS[key]}`);
    await expect(counter).toHaveClass(/\bfull\b/);
  });
}

test('닉네임 최소: 빈 값은 대체 문구, 한 글자는 그대로 표시', async ({ page }) => {
  await gotoConcept(page, 'p');
  const card = page.locator('#preview-card');
  await page.fill('#inp-nickname', '');
  await expect(card).toContainText(messages.ko.nickFallback);
  await page.fill('#inp-nickname', '뷁');
  await expect(card).toContainText('뷁');
  await expect(card).not.toContainText(messages.ko.nickFallback);
});

test('공유 링크의 과도한 값은 상한으로 잘리고 ?c= 는 제거된다', async ({ page }) => {
  const c = Buffer.from(JSON.stringify({ t: '가'.repeat(500), d: 'x'.repeat(200) }), 'utf8').toString('base64url');
  await page.goto(`/introduce/concept/p?c=${c}`);
  await page.locator('#preview-card').waitFor();
  expect([...(await page.inputValue('#inp-free'))].length).toBe(LIMITS.freeText);
  expect([...(await page.inputValue('#inp-dislike'))].length).toBe(LIMITS.dislike);
  expect(page.url()).not.toContain('c=');
});

test('커스텀 필드(handle)는 maxLength 20 을 지킨다', async ({ page }) => {
  await gotoConcept(page, 't');
  await page.locator('#inp-custom-handle').pressSequentially('@'.padEnd(25, 'a'));
  expect((await page.inputValue('#inp-custom-handle')).length).toBe(20);
});
