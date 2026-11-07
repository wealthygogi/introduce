import { expect, test } from '@playwright/test';

test.describe('random picker settings', () => {
  test('desktop controls align and stage filtering works without a role selection', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.goto('/introduce/characters/random?lang=ko');

    const panel = page.locator('.random-settings');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.random-field select').nth(1)).toBeEnabled();
    await expect(panel.getByText('선택한 작품의 출연 기록 기준으로 필터링합니다.')).toBeVisible();
    const selectStyles = await panel.locator('select').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element);
      return { appearance: style.appearance, backgroundImage: style.backgroundImage, paddingInlineEnd: style.paddingInlineEnd };
    }));
    expect(selectStyles.length).toBeGreaterThan(0);
    for (const style of selectStyles) {
      expect(style.appearance).toBe('none');
      expect(style.backgroundImage).toContain('linear-gradient');
      expect(style.paddingInlineEnd).toBe('28px');
    }

    const bounds = await panel.evaluate(element => {
      const countButtons = [...element.querySelector('.random-filter-group .random-segment')!.querySelectorAll('button')];
      const roleButtons = [...element.querySelectorAll('.random-chip-grid button')];
      const fields = [...element.querySelectorAll('.random-field select')];
      return {
        panelWidth: element.getBoundingClientRect().width,
        countWidths: countButtons.map(button => button.getBoundingClientRect().width),
        roleWidths: roleButtons.map(button => button.getBoundingClientRect().width),
        roleLefts: roleButtons.map(button => Math.round(button.getBoundingClientRect().left)),
        fieldWidths: fields.map(field => field.getBoundingClientRect().width),
        countHeights: countButtons.map(button => button.getBoundingClientRect().height),
      };
    });
    expect(bounds.panelWidth).toBeGreaterThanOrEqual(344);
    expect(Math.max(...bounds.countWidths) - Math.min(...bounds.countWidths)).toBeLessThan(1);
    expect(new Set(bounds.roleLefts).size).toBe(2);
    expect(Math.max(...bounds.roleWidths) - Math.min(...bounds.roleWidths)).toBeLessThan(1);
    expect(Math.max(...bounds.fieldWidths) - Math.min(...bounds.fieldWidths)).toBeLessThan(1);
    expect(new Set(bounds.countHeights)).toEqual(new Set([48]));

    const stage = panel.locator('.random-field select').nth(1);
    const firstStage = await stage.locator('option').nth(1).getAttribute('value');
    expect(firstStage).toBeTruthy();
    await stage.selectOption(firstStage!);
    await expect(stage).toHaveValue(firstStage!);
    await expect(panel.locator('.random-chip-grid button[aria-pressed="true"]')).toHaveCount(0);

    await panel.locator('.random-field select').first().selectOption('books');
    await expect(stage).toBeDisabled();
    await expect(panel.getByText('서적에는 스테이지 필터가 없습니다.')).toBeVisible();
  });

  test('mobile filter sheet exposes aligned, tappable controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/introduce/characters/random?lang=ko');
    await page.locator('.random-settings-trigger').click();

    const sheet = page.locator('.random-filter-sheet[open]');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.random-filter-group').first().getByRole('button').first()).toBeVisible();
    const minControlHeight = await sheet.locator('.random-segment button, .random-chip-grid button, .random-field select').evaluateAll(elements =>
      Math.min(...elements.map(element => element.getBoundingClientRect().height)),
    );
    expect(minControlHeight).toBeGreaterThanOrEqual(48);
    const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(pageWidth).toBeLessThanOrEqual(390);
  });

  test('development prototype previews five effects, lets them be mixed, and skips reveal', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.goto('/introduce/characters/random/prototype?lang=ko');
    await expect(page.locator('.random-fx-heading h1')).toHaveText('환상향 럭키 드로우 연출 프로토타입');
    await expect(page.locator('.random-fx-preset-grid > button')).toHaveCount(5);

    await page.getByRole('button', { name: '10장' }).click();
    await expect(page.locator('.random-fx-card')).toHaveCount(10);
    await page.locator('.random-fx-slots select').nth(0).selectOption('sakura');
    await expect(page.locator('.random-fx-backdrop')).toHaveClass(/fx-prep--sakura/);
    await page.getByRole('button', { name: '모두 공개' }).click();
    await expect(page.locator('.random-fx-cards')).toHaveAttribute('data-skip', 'true');
    await expect(page.locator('.random-fx-card-face strong').first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      card: document.querySelector('.random-fx-card')?.getBoundingClientRect().width ?? 0,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.card).toBeGreaterThan(80);
  });

  test('live draw reveals ten cards with a random series effect and mobile layout stays in bounds', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/introduce/characters/random?lang=ko');
    await page.locator('.random-settings-trigger').click();
    const countOptions = page.locator('.random-filter-sheet .random-filter-group').first().getByRole('button');
    await expect(countOptions).toHaveCount(4);
    expect(await countOptions.allTextContents()).toEqual(['1인', '3연', '5연', '10연']);
    await countOptions.nth(3).click();
    await page.locator('.random-filter-sheet-header button').click();
    await page.locator('.random-draw-cta .random-primary-action').click();

    const reveal = page.locator('.random-reveal');
    await expect(reveal).toBeVisible();
    await expect(reveal.locator('.random-reveal-card')).toHaveCount(10);
    await expect(reveal).toHaveAttribute('data-series', /^th(?:[6-9]|1\d|20)$/);
    await expect(page.locator('.random-result')).toHaveCount(0);
    await expect(page.locator('.random-history-item')).toHaveCount(0);
    await expect(page.locator('.random-stage-peek')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await reveal.getByRole('button', { name: '연출 건너뛰기' }).click();
    await expect(page.locator('.random-result-name')).toHaveCount(10);
    await expect(page.locator('.random-result-actions button')).toHaveCount(2);
    await expect(page.locator('.random-draw-cta .random-primary-action')).toBeFocused();
  });

  test('automatic reveal holds the last card before exposing names and keyboard can reach Skip', async ({ page }) => {
    await page.goto('/introduce/characters/random?lang=ko');
    const draw = page.locator('.random-draw-cta .random-primary-action');
    await draw.click();
    const reveal = page.locator('.random-reveal');
    await expect(reveal).toBeVisible();
    await expect(page.locator('.random-result-name')).toHaveCount(0);
    await expect(page.locator('.random-history-item')).toHaveCount(0);
    const portraitWidth = await reveal.locator('.random-reveal-portrait').evaluate(element => element.getBoundingClientRect().width);
    expect(portraitWidth).toBeLessThanOrEqual(96);

    const lastCardAnimation = page.locator('.random-reveal-card-inner').last().evaluate(element => new Promise<void>(resolve => {
      element.addEventListener('animationend', () => resolve(), { once: true });
    }));
    await lastCardAnimation;
    await expect(reveal).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(reveal.getByRole('button', { name: '연출 건너뛰기' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.random-result-name')).toHaveCount(1);
    await expect(page.locator('.random-history-item')).toHaveCount(1);
    const resultPortraitWidth = await page.locator('.random-result--1 .random-result-portrait').evaluate(element => element.getBoundingClientRect().width);
    expect(resultPortraitWidth).toBeLessThanOrEqual(96);
    await expect(draw).toBeFocused();
  });

  test('reduced motion reveals the fixed result immediately without animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/introduce/characters/random?lang=ko');
    await page.locator('.random-draw-cta .random-primary-action').click();
    await expect(page.locator('.random-reveal')).toHaveCount(0);
    await expect(page.locator('.random-result-name')).toHaveCount(1);
    await expect(page.locator('.random-history-item')).toHaveCount(1);
  });
});
