import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

let server, browser, base;
before(async () => {
  server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce/wide/hifuu`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); await server?.close(); });
async function pageFor(t) {
  const context = await browser.newContext({ locale: 'ko-KR' });
  t.after(() => context.close());
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  await context.addInitScript(() => {
    localStorage.setItem('introduce:form:v1', JSON.stringify({ marker: 'v1-only' }));
    if (!sessionStorage.getItem('wide-test-initialized')) {
      localStorage.setItem('introduce:form:v2', JSON.stringify({ rankedCharacters: [], favoriteWorks: [] }));
      sessionStorage.setItem('wide-test-initialized', '1');
    }
  });
  const page = await context.newPage();
  await page.goto(base);
  await page.locator('details.wide-form-group').nth(1).locator('summary').click();
  await page.locator('details.wide-form-group').nth(2).locator('summary').click();
  return page;
}

test('ranked characters enforce cap, prevent duplicates, and maintain contiguous order', async t => {
  const page = await pageFor(t);
  const ids = ['reimu', 'marisa', 'sanae', 'aya', 'reisen', 'youmu', 'sakuya', 'cirno'];
  for (const id of ids.slice(0, 7)) await page.locator(`[data-character-choice="${id}"]`).click();
  assert.equal(await page.locator('#wide-export [data-ranked-character]').count(), 7);
  assert.equal(await page.locator('[data-character-choice="cirno"]').isDisabled(), true);
  assert.equal(await page.locator('[data-character-choice="reimu"]').isDisabled(), true);
  await page.locator('[data-rank-down="reimu"]').click();
  await page.locator('[data-rank-remove="sanae"]').click();
  const ranks = await page.locator('#wide-export [data-ranked-character]').evaluateAll(nodes => nodes.map(n => [n.dataset.rankedCharacter, n.dataset.rank]));
  assert.deepEqual(ranks, [['marisa','1'],['reimu','2'],['aya','3'],['reisen','4'],['youmu','5'],['sakuya','6']]);
  await page.reload();
  assert.deepEqual(await page.locator('#wide-export [data-ranked-character]').evaluateAll(nodes => nodes.map(n => n.dataset.rankedCharacter)), ['marisa','reimu','aya','reisen','youmu','sakuya']);
});

test('favorites share five-item cap across media and recover after removal', async t => {
  const page = await pageFor(t);
  const works = ['th10','th12','book-b036981ba92d','music-352e4ada578a','music-11cd7e63b384'];
  for (const id of works) await page.locator(`[data-work-choice="${id}"]`).click();
  assert.equal(await page.locator(`[data-work-choice="th13"]`).isDisabled(), true);
  await page.locator('[data-work-remove="th10"]').click();
  await page.locator('[data-work-choice="th13"]').click();
  assert.equal(await page.locator('#wide-export [data-favorite-work]').count(), 5);
});

test('empty selections survive reload and theme/layout navigation', async t => {
  const page = await pageFor(t);
  assert.equal(await page.locator('#wide-export [data-ranked-character]').count(), 0);
  assert.equal(await page.locator('#wide-export [data-favorite-work]').count(), 0);
  await page.goto(new URL('/introduce/wide/paper', base).toString());
  await page.locator('[data-wide-layout="row"]').click();
  await page.reload();
  assert.equal(await page.locator('#wide-export [data-ranked-character]').count(), 0);
  assert.equal(await page.locator('#wide-export [data-favorite-work]').count(), 0);
});

test('normalizes malformed persisted selections without navigation races', async t => {
  const page = await pageFor(t);
  await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
    draft.rankedCharacters = ['reimu', 'unknown', 'reimu', 'marisa', 'sanae', 'aya', 'reisen', 'youmu', 'sakuya', 'cirno'];
    draft.favoriteWorks = ['th10', 'unknown', 'th10', 'th12', 'book-b036981ba92d', 'music-352e4ada578a', 'music-11cd7e63b384', 'book-cf28be624808'];
    localStorage.setItem('introduce:form:v2', JSON.stringify(draft));
  });
  await page.reload();
  assert.deepEqual(await page.locator('#wide-export [data-ranked-character]').evaluateAll(nodes => nodes.map(n => n.dataset.rankedCharacter)), ['reimu','marisa','sanae','aya','reisen','youmu','sakuya']);
  assert.deepEqual(await page.locator('#wide-export [data-favorite-work]').evaluateAll(nodes => nodes.map(n => n.dataset.favoriteWork)), ['th10','th12','book-b036981ba92d','music-352e4ada578a','music-11cd7e63b384']);
});

test('sprite-less catalog characters can be ranked without broken images or fallback', async t => {
  const page = await pageFor(t);
  const spriteLess = await page.evaluate(async () => (await import('/introduce/src/data/profileCatalog.ts')).PROFILE_CHARACTERS.find(character => !character.spriteRel));
  assert.ok(spriteLess, 'catalog should contain a sprite-less character');
  await page.locator('#wide-character-search').fill(spriteLess.ko);
  await page.locator(`[data-character-choice="${spriteLess.id}"]`).click();
  const rank = page.locator(`[data-ranked-character="${spriteLess.id}"]`);
  assert.equal(await rank.getAttribute('data-rank'), '1');
  assert.ok((await rank.innerText()).includes(spriteLess.ko));
  assert.equal(await rank.locator('img').count(), 0);
  assert.equal(await page.locator('#wide-export .wide-profile img').count(), 0);
  assert.equal(await page.locator('#wide-export .wide-neutral-avatar').getAttribute('aria-label'), spriteLess.ko);
  assert.equal(await page.locator('#wide-export [data-ranked-character]').count(), 1);
});

test('title lookup retains distinct IDs for same-name game and book catalog entries', async t => {
  const page = await pageFor(t);
  const entries = await page.evaluate(async () => {
    const { PROFILE_WORKS } = await import('/introduce/src/data/profileCatalog.ts');
    return PROFILE_WORKS.filter(work => work.ko.startsWith('동방문화첩')).map(work => ({ id: work.id, category: work.category }));
  });
  assert.deepEqual(entries.map(entry => entry.category).sort(), ['book', 'game']);
  const ids = entries.map(entry => entry.id);
  assert.equal(new Set(ids).size, 2);
  await page.locator('#wide-work-search').fill('동방문화첩');
  for (const id of ids) await page.locator(`[data-work-choice="${id}"]`).click();
  assert.deepEqual(await page.locator('#wide-export [data-favorite-work]').evaluateAll(nodes => nodes.map(node => node.dataset.favoriteWork)), ids);
});

test('legacy choices migrate while preserving raw Compact choices and custom notes', async t => {
  const page = await pageFor(t);
  await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
    localStorage.setItem('introduce:form', JSON.stringify(draft));
    localStorage.removeItem('introduce:form:v2');
    delete draft.rankedCharacters;
    delete draft.favoriteWorks;
    draft.selectedChar = 'reimu';
    draft.selectedSeries = ['th10'];
    draft.custom = { ...(draft.custom || {}), 'wide:characters': '키리사메 마리사, 코치야 사나에', 'wide:otherWorks': '동방영나암\n몽위과학세기\n대공마술', 'wide:pairing': '', 'wide:dislike': '', 'wide:freeText': '' };
    localStorage.setItem('introduce:form', JSON.stringify(draft));
  });
  await page.reload();

  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:form:v2')));
  assert.equal(await page.evaluate(() => localStorage.getItem('introduce:form:v1')), JSON.stringify({ marker: 'v1-only' }));
  assert.ok(await page.evaluate(() => localStorage.getItem('introduce:form')), 'legacy key remains available after upgrade');
  assert.deepEqual(migrated.rankedCharacters, ['reimu','marisa','sanae']);
  assert.deepEqual(migrated.favoriteWorks, ['th10','book-b036981ba92d','music-352e4ada578a','music-11cd7e63b384']);
  assert.equal(migrated.selectedChar, 'reimu');
  assert.deepEqual(migrated.selectedSeries, ['th10']);
  assert.equal(migrated.custom['wide:characters'], '키리사메 마리사, 코치야 사나에');
  assert.equal(migrated.custom['wide:otherWorks'], '동방영나암\n몽위과학세기\n대공마술');
  const savedBeforeLegacyWrite = await page.evaluate(() => {
    const current = localStorage.getItem('introduce:form:v2');
    localStorage.setItem('introduce:form', JSON.stringify({ nickname: 'written by v1' }));
    return current;
  });
  await page.reload();
  assert.deepEqual(
    await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:form:v2'))),
    JSON.parse(savedBeforeLegacyWrite),
    'v1 writes to its legacy key do not replace the current draft',
  );
  await page.evaluate(async () => {
    const { PROFILE_CHARACTERS } = await import('/introduce/src/data/profileCatalog.ts');
    const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
    delete draft.rankedCharacters;
    draft.custom['wide:characters'] = PROFILE_CHARACTERS.slice(0, 9).map(character => character.ko).join(', ');
    localStorage.setItem('introduce:form:v2', JSON.stringify(draft));
  });
  await page.reload();
  const overLimit = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:form:v2')));
  assert.equal(overLimit.custom['wide:selectionReview'], '1');
  await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
    delete draft.rankedCharacters;
    draft.custom['wide:characters'] = '이름이 불확실한 인물';
    localStorage.setItem('introduce:form:v2', JSON.stringify(draft));
  });
  await page.reload();
  const ambiguous = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:form:v2')));
  assert.equal(ambiguous.custom['wide:selectionReview'], '1');
});

test('public share codec preserves ordered selections and intentionally empty arrays', async t => {
  const page = await pageFor(t);
  const result = await page.evaluate(async () => {
    const codec = await import('/introduce/src/lib/formStateCodec.ts');
    const state = JSON.parse(localStorage.getItem('introduce:form:v2'));
    state.selectedSeries = new Set(state.selectedSeries);
    state.selectedAcct = new Set(state.selectedAcct);
    state.rankedCharacters = ['marisa', 'reimu', 'sanae'];
    state.favoriteWorks = ['music-11cd7e63b384', 'th12', 'book-b036981ba92d'];
    state.custom['wide:freeText'] = '長文🙂'.repeat(300);
    const populated = codec.decodeShareParam(codec.encodeShareParam(state));
    state.rankedCharacters = [];
    state.favoriteWorks = [];
    const empty = codec.decodeShareParam(codec.encodeShareParam(state));
    return { populated: [populated.rankedCharacters, populated.favoriteWorks, populated.custom['wide:freeText']], empty: [empty.rankedCharacters, empty.favoriteWorks] };
  });
  assert.deepEqual(result.populated.slice(0, 2), [['marisa','reimu','sanae'],['music-11cd7e63b384','th12','book-b036981ba92d']]);
  assert.equal(result.populated[2], '長文🙂'.repeat(300));
  assert.deepEqual(result.empty, [[],[]]);
});
test('legacy shared notes migrate once into independent Wide fields and preserve long text', async t => {
  const page = await pageFor(t);
  const legacyText = 'Wide 원문·long text 🙂 '.repeat(12);
  const longFreeText = 'Wide free text 長文🙂 '.repeat(48);
  await page.evaluate(({ legacyText, longFreeText }) => {
    const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
    draft.dislike = legacyText;
    draft.pairing = legacyText;
    draft.freeText = longFreeText;
    delete draft.custom['wide:dislike'];
    delete draft.custom['wide:pairing'];
    delete draft.custom['wide:freeText'];
    localStorage.setItem('introduce:form:v2', JSON.stringify(draft));
  }, { legacyText, longFreeText });
  await page.reload();
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:form:v2')));
  assert.equal(migrated.custom['wide:dislike'], legacyText);
  assert.equal(migrated.custom['wide:pairing'], legacyText);
  assert.equal(migrated.custom['wide:freeText'], longFreeText);
  assert.notEqual(migrated.dislike, legacyText);
  await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('introduce:form:v2'));
    draft.dislike = 'Compact edit';
    draft.custom['wide:dislike'] = '';
    draft.custom['wide:pairing'] = '';
    draft.custom['wide:freeText'] = '';
    localStorage.setItem('introduce:form:v2', JSON.stringify(draft));
  });
  await page.reload();
  const cleared = await page.evaluate(() => JSON.parse(localStorage.getItem('introduce:form:v2')));
  assert.equal(cleared.custom['wide:dislike'], '');
  assert.equal(cleared.custom['wide:pairing'], '');
  assert.equal(cleared.custom['wide:freeText'], '');
  assert.equal(cleared.dislike, 'Compact edit');
});
test('quota during versioned migration leaves the recoverable legacy photo draft intact', async t => {
  const page = await pageFor(t);
  const result = await page.evaluate(async () => {
    const legacy = { nickname: 'photo', profileImage: 'data:image/png;base64,original', selectedChar: 'reimu', selectedSeries: [] };
    localStorage.setItem('introduce:form', JSON.stringify(legacy));
    localStorage.removeItem('introduce:form:v2');
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'introduce:form:v2' && JSON.parse(value).profileImage) throw new DOMException('quota', 'QuotaExceededError');
      return originalSetItem.call(this, key, value);
    };
    const codec = await import('/introduce/src/lib/formStateCodec.ts');
    codec.saveToStorage(codec.loadInitialState());
    return {
      current: localStorage.getItem('introduce:form:v2'),
      legacy: JSON.parse(localStorage.getItem('introduce:form')),
    };
  });
  assert.equal(result.current, null);
  assert.equal(result.legacy.profileImage, 'data:image/png;base64,original');
});
