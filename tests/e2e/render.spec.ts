import { test, expect } from '@playwright/test';
import { messages } from '../../src/data/i18n';
import { ACCT_TYPES } from '../../src/data/accountTypes';
import { NEW_IDS, PRESET_B_IDS, SCENARIOS, EMPTY, CHAR_NAME, type Lang, type PlainState } from './fixtures';
import { gotoConcept, expectFrame, expectNoOverflow } from './helpers';

const CASES: [name: string, state: PlainState, lang: Lang][] = [
  ['full', SCENARIOS.full, 'ko'],
  ['long', SCENARIOS.long, 'ko'],
  ['edge', SCENARIOS.edge, 'ko'],
  ['ja', SCENARIOS.ja, 'ja'],
  ['en', SCENARIOS.en, 'en'],
  ['empty', EMPTY, 'ko'],
];
/** 잘림 없이 전부 보여야 하는 짧은 입력 시나리오 */
const FITS: Record<string, true> = { full: true, ja: true, en: true };
const daily = ACCT_TYPES.find((a) => a.id === 'daily')!;

for (const id of NEW_IDS) {
  test.describe(`concept ${id}`, () => {
    for (const [name, state, lang] of CASES) {
      test(`${name} (${lang})`, async ({ page }) => {
        const errors = await gotoConcept(page, id, { lang, state });
        const card = page.locator('#preview-card');
        await expectFrame(card);
        await expectNoOverflow(card, { allowTruncate: !FITS[name] });

        if (FITS[name]) {
          await expect(card).toContainText(state.nickname);
          await expect(card).toContainText(CHAR_NAME.marisa[lang]);
          await expect(card).toContainText(state.dislike);
          await expect(card).toContainText(state.pairing);
          await expect(card).toContainText(state.freeText.split('\n')[0]);
          await expect(card).toContainText('TH06');
          await expect(card).toContainText(daily[lang]);
          if (id === 't') await expect(card).toContainText(state.custom.handle);
        }
        if (name === 'long') {
          expect(await card.locator('.pc-chip.more').count()).toBeGreaterThanOrEqual(1);
          await expect(card.locator('.pc-chip.more').first()).toBeVisible();
          const maxSeries = PRESET_B_IDS.includes(id) ? 4 : 6;
          expect(await card.locator('.pc-series .pc-chip:not(.more)').count()).toBeLessThanOrEqual(maxSeries);
        }
        if (name === 'empty') {
          await expect(card).toContainText(messages.ko.nickFallback);
          await expect(card.locator('.pc-note-v').first()).toHaveText('—');
        }
        expect(errors).toEqual([]);
      });
    }
  });
}

for (const theme of ['light', 'dark', 'spring', 'summer', 'autumn', 'winter']) {
  test(`concept p · theme ${theme}`, async ({ page }) => {
    const errors = await gotoConcept(page, 'p', { theme, state: SCENARIOS.full });
    await expectFrame(page.locator('#preview-card'));
    expect(errors).toEqual([]);
  });
}
