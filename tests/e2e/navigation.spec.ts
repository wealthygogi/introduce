import { expect, test, type Locator, type Page } from '@playwright/test';
import { NEW_IDS } from './fixtures';
import { WIDE_THEMES } from '../../src/data/wideThemes';

const routes = [
  { path: '/', marker: '.landing-modes:not(.gallery-page)', primary: null, section: null, parent: null },
  { path: '/sheets', marker: '.landing-modes.gallery-page', primary: '/sheets', section: null, parent: '/' },
  { path: '/compact', marker: '.compact-gallery', primary: '/sheets', section: '/compact', parent: '/sheets' },
  ...NEW_IDS.map(id => ({ path: `/concept/${id}`, marker: '.page-shell', primary: '/sheets', section: '/compact', parent: '/compact' })),
  { path: '/wide', marker: '.wide-gallery', primary: '/sheets', section: '/wide', parent: '/sheets' },
  ...WIDE_THEMES.map(({ id }) => ({ path: `/wide/${id}`, marker: '#wide-export', primary: '/sheets', section: '/wide', parent: '/wide' })),
  { path: '/characters', marker: '.character-related-page', primary: '/characters', section: null, parent: '/' },
  { path: '/characters/tastes', marker: '.taste-board-group', primary: '/characters', section: '/characters/tastes', parent: '/characters' },
  { path: '/coupling', marker: '.coupling-hub', primary: '/characters', section: '/coupling', parent: '/characters', editor: '/coupling' },
  ...(['whiteboard', 'keyboard', 'pairs', 'matrix'] as const).map(name => ({ path: `/coupling/${name}`, marker: `.coupling-${name === 'matrix' ? 'matrix-editor' : name}`, primary: '/characters', section: '/coupling', parent: '/coupling', editor: `/coupling/${name}` })),
];
const languages = ['ko', 'ja', 'en'] as const;
const viewports = [{ width: 1440, height: 1000 }, { width: 390, height: 844 }];

// Every route is covered at both viewport sizes in Korean; other locales are covered on representative routes.
const routeCases = [
  ...routes.flatMap(route => viewports.map(viewport => ({ route, lang: 'ko' as const, viewport }))),
  ...routes
    .filter(route => ['/concept/p', '/characters/tastes', '/coupling/matrix'].includes(route.path))
    .flatMap(route => languages.filter(lang => lang !== 'ko').flatMap(lang => viewports.map(viewport => ({ route, lang, viewport })))),
];

const parentNames: Record<string, Record<(typeof languages)[number], string>> = {
  '/': { ko: '홈으로', ja: 'ホームへ', en: 'Home' },
  '/sheets': { ko: '자기소개표 목록', ja: 'プロフィール形式一覧', en: 'Profile sheet modes' },
  '/compact': { ko: 'Compact 갤러리', ja: 'Compact ギャラリー', en: 'Compact gallery' },
  '/wide': { ko: 'Wide 갤러리', ja: 'Wide ギャラリー', en: 'Wide gallery' },
  '/characters': { ko: '캐릭터 도구 목록', ja: 'キャラクターツール一覧', en: 'Character tools' },
  '/coupling': { ko: '관계 도구 목록', ja: '関係ツール一覧', en: 'Relationship tools' },
};

async function seedNavigationContext(page: Page, lang: (typeof languages)[number], seedTaste = true) {
  const board = {
    version: 1,
    data: {
      title: '탐색 보존 제목', titleSource: 'custom', theme: 'paper', showNames: true,
      groups: [{
        id: 'nav-group', title: '탐색 보존 그룹', titleSource: 'custom', rows: 1, columns: 1,
        cells: [{ characters: ['reimu'], label: '탐색 메모', versionWorkIds: { reimu: 'th18' } }],
        slots: [{ label: '사용자 칸', topicId: 'th18', labelSource: 'custom' }],
      }],
    },
  };
  await page.addInitScript(({ initialLang, boardJson }) => {
    if (!localStorage.getItem('introduce:lang')) localStorage.setItem('introduce:lang', initialLang);
    if (!localStorage.getItem('introduce:theme')) localStorage.setItem('introduce:theme', 'light');
    if (boardJson && !localStorage.getItem('introduce:characters:taste-board:v1')) {
      localStorage.setItem('introduce:characters:taste-board:v1', boardJson);
    }
  }, { initialLang: lang, boardJson: seedTaste ? JSON.stringify(board) : null });
}

test.describe('navigation route and current-location matrix', () => {
  for (const { route, lang, viewport } of routeCases) {
    test(`${route.path} · ${lang} · ${viewport.width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await seedNavigationContext(page, lang);
      await page.setViewportSize(viewport);
      await page.goto(`/introduce${route.path}`, { waitUntil: 'commit' });
      await expect(page.locator(route.marker).first()).toBeAttached({ timeout: 15_000 });
      await page.reload({ waitUntil: 'commit' });
      await expect(page.locator(route.marker).first()).toBeAttached({ timeout: 15_000 });
      await expect(page).toHaveURL(new RegExp(`/introduce${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));

      const header = page.locator('header.top-nav');
      const primary = header.getByRole('navigation', { name: lang === 'ko' ? '주요 메뉴' : lang === 'ja' ? 'メインメニュー' : 'Main menu' });
      const sheetNav = header.getByRole('navigation', { name: lang === 'ko' ? '자기소개표 방식' : lang === 'ja' ? 'プロフィール形式' : 'Profile sheet editors' });
      const characterNav = header.getByRole('navigation', { name: lang === 'ko' ? '캐릭터 도구' : lang === 'ja' ? 'キャラクターツール' : 'Character tools' });
      const primaryLinks = primary.locator('a');
      await expect(primaryLinks).toHaveCount(2);
      const currentPrimary = primary.locator('[aria-current]');
      await expect(currentPrimary).toHaveCount(route.primary ? 1 : 0);
      if (route.primary) await expect(currentPrimary).toHaveAttribute('href', `/introduce${route.primary}`);
      if (route.path === '/' || route.path.startsWith('/characters') || route.path.startsWith('/coupling')) await expect(sheetNav).toHaveCount(0);
      else {
        await expect(sheetNav.locator('a')).toHaveCount(2);
        const currentSection = sheetNav.locator('[aria-current]');
        await expect(currentSection).toHaveCount(route.section ? 1 : 0);
        if (route.section) await expect(currentSection).toHaveAttribute('href', `/introduce${route.section}`);
      }
      if (route.path.startsWith('/characters') || route.path.startsWith('/coupling')) {
        await expect(characterNav.locator('a')).toHaveCount(2);
        await expect(characterNav.locator('[aria-current]')).toHaveCount(route.section ? 1 : 0);
      }
      const parent = header.locator('.nav-row > a.btn.ghost');
      if (route.parent) {
        await expect(parent).toHaveAttribute('href', `/introduce${route.parent}`);
        await expect(parent).toHaveAccessibleName(parentNames[route.parent][lang]);
      } else await expect(parent).toHaveCount(0);
      if (route.editor) {
        const tabs = page.getByRole('navigation', { name: lang === 'ko' ? '관계 편집 방식' : lang === 'ja' ? '関係の編集方式' : 'Relationship editors' });
        await expect(tabs.locator('a')).toHaveCount(5);
        await expect(tabs.locator('[aria-current="page"]')).toHaveAttribute('href', `/introduce${route.editor}`);
      }
      expect(errors).toEqual([]);
    });
  }
});

test('header links traverse the sheet and character hierarchies', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/introduce/characters');
  const header = page.locator('header.top-nav');
  await header.locator('.section-subnav a[href="/introduce/coupling"]').click();
  await expect(page).toHaveURL(/\/introduce\/coupling$/);
  await expect(page.locator('.coupling-hub')).toBeAttached();
  const relationshipTabs = page.locator('main nav.coupling-tabs');
  await relationshipTabs.locator('a[href="/introduce/coupling/matrix"]').click();
  await expect(page).toHaveURL(/\/introduce\/coupling\/matrix$/);
  await expect(page.locator('.coupling-matrix-editor')).toBeAttached();
  await expect(header.locator('.primary-mode-nav a[href="/introduce/characters"]')).toHaveAttribute('aria-current', 'location');
  await header.locator('.nav-row a[href="/introduce/coupling"]').click();
  await expect(page.locator('.coupling-hub')).toBeAttached();
  await header.locator('.nav-row a[href="/introduce/characters"]').click();
  await expect(page.locator('.character-related-page')).toBeAttached();
});

test.describe('responsive navigation breakpoints', () => {
  const breakpointLanguages = { '/concept/p': 'en', '/characters/tastes': 'ja', '/coupling/matrix': 'ko' } as const;
  for (const path of ['/concept/p', '/characters/tastes', '/coupling/matrix'] as const) {
    const lang = breakpointLanguages[path];
    for (const width of [320, 560, 561, 768, 880, 881]) {
      test(`${path} · ${lang} · ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`/introduce${path}?lang=${lang}`, { waitUntil: 'commit' });
        await expect(page.locator('header.top-nav')).toBeAttached();
        const metrics = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          header: document.querySelector('header.top-nav')!.getBoundingClientRect().toJSON(),
          subnav: document.querySelector('.section-subnav')!.getBoundingClientRect().toJSON(),
          links: Array.from(document.querySelectorAll('header .mode-nav a, header .nav-row > a')).map(link => {
            const rect = link.getBoundingClientRect();
            return { width: rect.width, height: rect.height, right: rect.right, left: rect.left };
          }),
        }));
        expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
        expect(metrics.subnav.left).toBeGreaterThanOrEqual(0);
        expect(metrics.subnav.right).toBeLessThanOrEqual(metrics.clientWidth + 1);
        for (const link of metrics.links) {
          expect(link.width).toBeGreaterThanOrEqual(44);
          expect(link.height).toBeGreaterThanOrEqual(44);
          expect(link.left).toBeGreaterThanOrEqual(0);
          expect(link.right).toBeLessThanOrEqual(metrics.clientWidth + 1);
        }
        if (path.startsWith('/coupling/') && width <= 390) {
          const tabs = page.locator('.coupling-tabs');
          await tabs.locator('a').last().scrollIntoViewIfNeeded();
          expect(await tabs.evaluate(element => element.scrollWidth)).toBeGreaterThan(await tabs.evaluate(element => element.clientWidth));
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
        }
      });
    }
  }
});

test('trailing slashes, query strings and hashes do not change current-location matching', async ({ page }) => {
  const cases: { url: string; primary: string; section: string; sectionCurrent: 'page' | 'location'; editor?: string }[] = [
    { url: '/characters/tastes/?lang=ja&probe=keep#board', primary: '/characters', section: '/characters/tastes', sectionCurrent: 'page' },
    { url: '/coupling/', primary: '/characters', section: '/coupling', sectionCurrent: 'page', editor: '/coupling' },
    { url: '/coupling/matrix/?lang=en#matrix', primary: '/characters', section: '/coupling', sectionCurrent: 'location', editor: '/coupling/matrix' },
    { url: '/wide/paper/?layout=row', primary: '/sheets', section: '/wide', sectionCurrent: 'location' },
  ];
  for (const route of cases) {
    await page.goto(`/introduce${route.url}`, { waitUntil: 'commit' });
    const header = page.locator('header.top-nav');
    await expect(header.locator(`.primary-mode-nav a[href="/introduce${route.primary}"]`)).toHaveAttribute('aria-current', 'location');
    await expect(header.locator(`.section-subnav a[href="/introduce${route.section}"]`)).toHaveAttribute('aria-current', route.sectionCurrent);
    if (route.editor) await expect(page.locator('.coupling-tabs [aria-current="page"]')).toHaveAttribute('href', `/introduce${route.editor}`);
    expect(new URL(page.url()).search).toBe(new URL(`http://test${route.url}`).search);
    expect(new URL(page.url()).hash).toBe(new URL(`http://test${route.url}`).hash);
  }
});

test('gallery cards open each Compact and Wide destination', async ({ page }) => {
  await page.goto('/introduce/compact', { waitUntil: 'commit' });
  const compactIds = NEW_IDS;
  for (const id of compactIds) {
    await page.locator(`.compact-gallery a[href="/introduce/concept/${id}"]`).click();
    await expect(page.locator('#card-export')).toBeAttached();
    await page.locator('header.top-nav .nav-row a[href="/introduce/compact"]').click();
    await expect(page.locator('.compact-gallery')).toBeAttached();
  }
  await page.goto('/introduce/wide', { waitUntil: 'commit' });
  for (const theme of WIDE_THEMES) {
    await page.locator(`.wide-gallery a[href="/introduce/wide/${theme.id}"]`).click();
    await expect(page.locator('#wide-export')).toBeAttached();
    await page.locator('header.top-nav .nav-row a[href="/introduce/wide"]').click();
    await expect(page.locator('.wide-gallery')).toBeAttached();
  }
});

test('all relationship editor tabs render their destination', async ({ page }) => {
  await page.goto('/introduce/coupling', { waitUntil: 'commit' });
  const editorMarkers = [
    '.coupling-whiteboard', '.coupling-keyboard', '.coupling-pairs', '.coupling-matrix-editor',
  ];
  const tabs = page.locator('main nav.coupling-tabs');
  for (let index = 0; index < editorMarkers.length; index++) {
    await tabs.locator('a').nth(index + 1).click();
    await expect(page.locator(editorMarkers[index])).toBeAttached();
  }
});

test('language and theme controls update state without dropping route context', async ({ page }) => {
  await page.goto('/introduce/characters?lang=ko&probe=keep#tools', { waitUntil: 'commit' });
  const header = page.locator('header.top-nav');
  const langButtons = header.locator('.lang-switcher button');
  for (const [index, lang] of languages.entries()) {
    await langButtons.nth(index).click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(langButtons.nth(index)).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(new RegExp(`[?&]lang=${lang}&probe=keep#tools$`));
  }
  const themes = ['light', 'dark', 'spring', 'summer', 'autumn', 'winter'];
  const themeButtons = header.locator('.theme-switcher button');
  await expect(themeButtons).toHaveCount(themes.length);
  for (const [index, theme] of themes.entries()) {
    await themeButtons.nth(index).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(themeButtons.nth(index)).toHaveAttribute('aria-pressed', 'true');
  }
  await page.reload({ waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'winter');
});

test('Back and Forward restore query, hash, and all navigation levels', async ({ page }) => {
  await page.goto('/introduce/characters?probe=keep#tools', { waitUntil: 'commit' });
  const header = page.locator('header.top-nav');
  await header.locator('.section-subnav a[href="/introduce/coupling"]').click();
  await page.locator('main nav.coupling-tabs a[href="/introduce/coupling/matrix"]').click();
  await expect(page.locator('.coupling-matrix-editor')).toBeAttached();
  await page.goBack();
  await expect(page.locator('.coupling-hub')).toBeAttached();
  await expect(header.locator('.section-subnav a[href="/introduce/coupling"]')).toHaveAttribute('aria-current', 'page');
  await page.goBack();
  await expect(page).toHaveURL(/\/introduce\/characters\?probe=keep#tools$/);
  await expect(header.locator('.primary-mode-nav a[href="/introduce/characters"]')).toHaveAttribute('aria-current', 'page');
  await expect(header.locator('.section-subnav [aria-current]')).toHaveCount(0);
  await page.goForward();
  await expect(page.locator('.coupling-hub')).toBeAttached();
  await page.goForward();
  await expect(page.locator('.coupling-matrix-editor')).toBeAttached();
  await expect(page.locator('main nav.coupling-tabs [aria-current="page"]')).toHaveAttribute('href', '/introduce/coupling/matrix');
});

test('keyboard focus follows visible header order in every language and editor area', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit defaults to skipping links during Tab navigation on macOS');
  for (const [langIndex, lang] of languages.entries()) {
    await page.goto('/introduce/coupling/matrix', { waitUntil: 'commit' });
    const header = page.locator('header.top-nav');
    await header.locator('.lang-switcher button').nth(langIndex).click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    for (const path of ['/coupling/matrix', '/concept/p']) {
      await page.goto(`/introduce${path}`, { waitUntil: 'commit' });
      await expect(page.locator(path.includes('coupling') ? '.coupling-matrix-editor' : '.page-shell')).toBeAttached();
      await header.locator('.brand').focus();
      const order = [
        header.locator('.primary-mode-nav a').nth(0),
        header.locator('.primary-mode-nav a').nth(1),
        header.locator('.nav-row > a'),
        ...Array.from({ length: 6 }, (_, index) => header.locator('.theme-switcher button').nth(index)),
        ...Array.from({ length: 3 }, (_, index) => header.locator('.lang-switcher button').nth(index)),
        header.locator('.section-subnav a').nth(0),
        header.locator('.section-subnav a').nth(1),
        ...(path.includes('coupling') ? Array.from({ length: 5 }, (_, index) => page.locator('main nav.coupling-tabs a').nth(index)) : []),
      ];
      for (const target of order) {
        await page.keyboard.press('Tab');
        await expect(target).toBeFocused();
        const outlineWidth = await target.evaluate(element => Number.parseFloat(getComputedStyle(element).outlineWidth));
        expect(outlineWidth).toBeGreaterThanOrEqual(3);
      }
      for (let index = order.length - 2; index >= 0; index--) {
        await page.keyboard.press('Shift+Tab');
        await expect(order[index]).toBeFocused();
      }
    }
  }
});

const parentTransitions = [
  { from: '/sheets', fromMarker: '.landing-modes.gallery-page', to: '/', marker: '.landing-modes:not(.gallery-page)' },
  { from: '/compact', fromMarker: '.compact-gallery', to: '/sheets', marker: '.landing-modes.gallery-page' },
  { from: '/concept/p', fromMarker: '#card-export', to: '/compact', marker: '.compact-gallery' },
  { from: '/wide', fromMarker: '.wide-gallery', to: '/sheets', marker: '.landing-modes.gallery-page' },
  { from: '/wide/paper', fromMarker: '#wide-export', to: '/wide', marker: '.wide-gallery' },
  { from: '/characters', fromMarker: '.character-related-page', to: '/', marker: '.landing-modes:not(.gallery-page)' },
  { from: '/characters/tastes', fromMarker: '.taste-board-group', to: '/characters', marker: '.character-related-page' },
  { from: '/coupling', fromMarker: '.coupling-hub', to: '/characters', marker: '.character-related-page' },
  { from: '/coupling/matrix', fromMarker: '.coupling-matrix-editor', to: '/coupling', marker: '.coupling-hub' },
];

for (const lang of languages) for (const viewport of viewports) {
  test(`home, hub cards, and parent links · ${lang} · ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width === 390 });
    try {
      const page = await context.newPage();
      await seedNavigationContext(page, lang);
      const activate = async (locator: Locator) => {
        if (viewport.width === 390) await locator.tap();
        else await locator.click();
      };
      const waitFor = (marker: string) => expect(page.locator(marker).first()).toBeAttached({ timeout: 15_000 });
      const header = page.locator('header.top-nav');
      await page.goto('/introduce/coupling/matrix', { waitUntil: 'commit' });
      await waitFor('.coupling-matrix-editor');
      await activate(header.locator('.brand'));
      await waitFor('.landing-modes:not(.gallery-page)');
      await activate(header.locator('.primary-mode-nav a[href="/introduce/sheets"]'));
      await waitFor('.landing-modes.gallery-page');
      await activate(header.locator('.section-subnav a[href="/introduce/compact"]'));
      await waitFor('.compact-gallery');
      await activate(header.locator('.section-subnav a[href="/introduce/wide"]'));
      await waitFor('.wide-gallery');
      await activate(header.locator('.nav-row > a[href="/introduce/sheets"]'));
      await waitFor('.landing-modes.gallery-page');
      await activate(header.locator('.brand'));
      for (const destination of ['/sheets', '/characters']) {
        await activate(page.locator(`main .landing-modes:not(.gallery-page) a[href="/introduce${destination}"]`));
        await waitFor(destination === '/sheets' ? '.landing-modes.gallery-page' : '.character-related-page');
        await activate(header.locator('.brand'));
      }
      await activate(header.locator('.primary-mode-nav a[href="/introduce/characters"]'));
      await waitFor('.character-related-page');
      await activate(page.locator('.character-related-page a[href="/introduce/characters/tastes"]'));
      await waitFor('.taste-board-group');
      await activate(header.locator('.nav-row > a[href="/introduce/characters"]'));
      await waitFor('.character-related-page');
      await activate(header.locator('.section-subnav a[href="/introduce/characters/tastes"]'));
      await waitFor('.taste-board-group');
      await activate(header.locator('.nav-row > a[href="/introduce/characters"]'));
      await waitFor('.character-related-page');
      await activate(page.locator('.character-related-page a[href="/introduce/coupling"]'));
      await waitFor('.coupling-hub');

      for (const transition of parentTransitions) {
        await page.goto(`/introduce${transition.from}`, { waitUntil: 'commit' });
        await waitFor(transition.fromMarker);
        const parent = header.locator(`.nav-row > a[href="/introduce${transition.to}"]`);
        await expect(parent).toHaveAccessibleName(parentNames[transition.to][lang]);
        await activate(parent);
        await expect(page).toHaveURL(new RegExp(`/introduce${transition.to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
        await waitFor(transition.marker);
      }
    } finally {
      await context.close();
    }
  });
}

test('Wide editor theme links preserve the selected row layout', async ({ page }) => {
  await page.goto('/introduce/wide/paper?layout=row', { waitUntil: 'commit' });
  const sheet = page.locator('#wide-export');
  await expect(sheet).toHaveAttribute('data-layout', 'row');
  const themeLinks = page.locator('.wide-theme-links a');
  await expect(themeLinks).toHaveCount(WIDE_THEMES.length);
  for (const theme of WIDE_THEMES) {
    const link = page.locator(`.wide-theme-links a[href="/introduce/wide/${theme.id}?layout=row"]`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/introduce/wide/${theme.id}\\?layout=row$`));
    await expect(sheet).toHaveAttribute('data-layout', 'row');
    await expect(page.locator('.wide-theme-links [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('.wide-theme-links [aria-current="page"]')).toHaveAttribute('href', `/introduce/wide/${theme.id}?layout=row`);
  }
});

test('taste-board data and visible labels survive navigation and reload', async ({ page }) => {
  await seedNavigationContext(page, 'ko');
  await page.goto('/introduce/characters/tastes', { waitUntil: 'commit' });
  await expect(page.locator('.taste-board-group')).toBeAttached();
  await expect(page.locator('.taste-board h2')).toHaveText('탐색 보존 제목');
  await expect(page.locator('.taste-board-group')).toContainText('하쿠레이 레이무');
  const original = await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1'));
  await page.locator('header.top-nav .section-subnav a[href="/introduce/coupling"]').click();
  await expect(page.locator('.coupling-hub')).toBeAttached();
  expect(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1'))).toBe(original);
  await page.locator('header.top-nav .primary-mode-nav a[href="/introduce/characters"]').click();
  await expect(page.locator('.character-related-page')).toBeAttached();
  await page.locator('header.top-nav .section-subnav a[href="/introduce/characters/tastes"]').click();
  await expect(page.locator('.taste-board h2')).toHaveText('탐색 보존 제목');
  await page.reload({ waitUntil: 'commit' });
  await expect(page.locator('.taste-board-group')).toBeAttached();
  await expect(page.locator('.taste-board-group')).toContainText('하쿠레이 레이무');
  expect(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1'))).toBe(original);
});

test('closing an unconfigured taste-board setup dialog leaves navigation available', async ({ page }) => {
  await seedNavigationContext(page, 'ko', false);
  await page.goto('/introduce/characters/tastes', { waitUntil: 'commit' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('header.top-nav .section-subnav')).toBeVisible();
  await dialog.locator('header button').click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('introduce:characters:taste-board:v1'))).toBeNull();
  await page.locator('header.top-nav .section-subnav a[href="/introduce/coupling"]').click();
  await expect(page.locator('.coupling-hub')).toBeAttached();
});

test('existing invalid-route redirects land on the established parent screen', async ({ page }) => {
  for (const [path, target, marker] of [
    ['/concept/zzz', '/', '.landing-modes:not(.gallery-page)'],
    ['/wide/unknown', '/wide', '.wide-gallery'],
    ['/coupling/unknown', '/coupling', '.coupling-hub'],
  ]) {
    await page.goto(`/introduce${path}`, { waitUntil: 'commit' });
    await expect(page).toHaveURL(new RegExp(`/introduce${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
    await expect(page.locator(marker)).toBeAttached();
  }
});

test('language selection without a lang query does not add one', async ({ page }) => {
  await page.goto('/introduce/characters', { waitUntil: 'commit' });
  await page.locator('header.top-nav .lang-switcher button').nth(1).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page).toHaveURL(/\/introduce\/characters$/);
  await page.reload({ waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page).toHaveURL(/\/introduce\/characters$/);
});

test('Enter activates each hierarchy link and keyboard-operable theme and language control', async ({ page }) => {
  await seedNavigationContext(page, 'ko');
  const links = [
    { from: '/coupling/matrix', selector: '.brand', to: '/', marker: '.landing-modes:not(.gallery-page)' },
    { from: '/characters', selector: '.primary-mode-nav a[href="/introduce/sheets"]', to: '/sheets', marker: '.landing-modes.gallery-page' },
    { from: '/sheets', selector: '.primary-mode-nav a[href="/introduce/characters"]', to: '/characters', marker: '.character-related-page' },
    { from: '/sheets', selector: '.section-subnav a[href="/introduce/compact"]', to: '/compact', marker: '.compact-gallery' },
    { from: '/sheets', selector: '.section-subnav a[href="/introduce/wide"]', to: '/wide', marker: '.wide-gallery' },
    { from: '/characters', selector: '.section-subnav a[href="/introduce/characters/tastes"]', to: '/characters/tastes', marker: '.taste-board-group' },
    { from: '/characters', selector: '.section-subnav a[href="/introduce/coupling"]', to: '/coupling', marker: '.coupling-hub' },
    { from: '/coupling/matrix', selector: '.nav-row > a[href="/introduce/coupling"]', to: '/coupling', marker: '.coupling-hub' },
    ...(['/sheets', '/compact', '/concept/p', '/wide', '/wide/paper', '/characters', '/characters/tastes', '/coupling', '/coupling/matrix'] as const).map(from => {
      const transition = {
        '/sheets': { to: '/', label: '.landing-modes:not(.gallery-page)' },
        '/compact': { to: '/sheets', label: '.landing-modes.gallery-page' },
        '/concept/p': { to: '/compact', label: '.compact-gallery' },
        '/wide': { to: '/sheets', label: '.landing-modes.gallery-page' },
        '/wide/paper': { to: '/wide', label: '.wide-gallery' },
        '/characters': { to: '/', label: '.landing-modes:not(.gallery-page)' },
        '/characters/tastes': { to: '/characters', label: '.character-related-page' },
        '/coupling': { to: '/characters', label: '.character-related-page' },
        '/coupling/matrix': { to: '/coupling', label: '.coupling-hub' },
      }[from]!;
      return {
        from,
        selector: `.nav-row > a[href="/introduce${transition.to}"]`,
        to: transition.to,
        marker: transition.label,
      };
    }),
    ...['/coupling', '/coupling/whiteboard', '/coupling/keyboard', '/coupling/pairs', '/coupling/matrix'].map((to, index) => ({
      from: '/coupling',
      selector: `main nav.coupling-tabs a[href="/introduce${to}"]`,
      to,
      marker: ['.coupling-hub', '.coupling-whiteboard', '.coupling-keyboard', '.coupling-pairs', '.coupling-matrix-editor'][index],
    })),
  ];
  for (const link of links) {
    await page.goto(`/introduce${link.from}`, { waitUntil: 'commit' });
    const target = page.locator(link.selector);
    await target.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/introduce${link.to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`));
    await expect(page.locator(link.marker)).toBeAttached();
  }
  const header = page.locator('header.top-nav');
  for (const [index, theme] of ['light', 'dark', 'spring', 'summer', 'autumn', 'winter'].entries()) {
    const button = header.locator('.theme-switcher button').nth(index);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }
  await page.goto('/introduce/characters', { waitUntil: 'commit' });
  for (const [index, lang] of languages.entries()) {
    const button = header.locator('.lang-switcher button').nth(index);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\/introduce\/characters$/);
  }
});
