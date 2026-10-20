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
  base = `http://127.0.0.1:${server.httpServer.address().port}/introduce/concept/p`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function newPage(t, options = {}) {
  const context = await browser.newContext({
    locale: 'ko-KR',
    viewport: { width: 1440, height: 1000 },
    ...options,
  });
  t.after(() => context.close());
  // These cases exercise state, not external font availability.
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
  const page = await context.newPage();
  await page.goto(base);
  return page;
}

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');

test('malformed shared values preserve the existing draft after navigation and reload', async t => {
  const page = await newPage(t);
  await page.fill('#inp-nickname', '남겨둔초안');
  await page.fill('#inp-free', '한국어・日本語 draft');
  for (const value of [[], [1], null, 42, 'invalid']) {
    await page.goto(`${base}?c=${encode(value)}`);
    assert.equal(await page.inputValue('#inp-nickname'), '남겨둔초안');
    assert.equal(await page.inputValue('#inp-free'), '한국어・日本語 draft');
    await page.reload();
    assert.equal(await page.inputValue('#inp-nickname'), '남겨둔초안');
  }
});

test('copied link restores the sender language and draft; subsequent language edits survive reload', async t => {
  const page = await newPage(t, { permissions: ['clipboard-read', 'clipboard-write'] });
  await page.fill('#inp-nickname', '공유할초안');
  await page.locator('.social-settings summary').click();
  await page.selectOption('#social-platform', 'twitter');
  await page.fill('#social-account', '@share_draft');
  await page.getByRole('button', { name: '日本語', exact: true }).click();
  await page.getByRole('button', { name: 'リンクをコピー', exact: true }).click();
  await page.getByRole('button', { name: 'コピーしました！', exact: true }).waitFor();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(new URL(url).pathname, '/introduce/concept/p');
  assert.equal(new URL(url).searchParams.get('lang'), 'ja');
  const recipient = await newPage(t);
  await recipient.goto(url);
  assert.equal(await recipient.locator('html').getAttribute('lang'), 'ja');
  assert.equal(await recipient.inputValue('#inp-nickname'), '공유할초안');
  assert.equal(await recipient.inputValue('#social-platform'), 'twitter');
  assert.equal(await recipient.inputValue('#social-account'), '@share_draft');
  assert.equal(new URL(recipient.url()).search, '');
  await recipient.getByRole('button', { name: 'EN', exact: true }).click();
  await recipient.reload();
  assert.equal(await recipient.locator('html').getAttribute('lang'), 'en');
  assert.equal(await recipient.inputValue('#social-platform'), 'twitter');
  assert.equal(await recipient.inputValue('#social-account'), '@share_draft');
});

test('legacy shares keep the recipient language and still restore a default or populated card', async t => {
  const page = await newPage(t);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.goto(`${base}?c=${encode({ n: '이전링크' })}`);
  assert.equal(await page.inputValue('#inp-nickname'), '이전링크');
  assert.equal(await page.inputValue('#social-platform'), 'none');
  assert.equal(await page.locator('#social-account').count(), 0);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  // An empty object is a valid share of the untouched default form, unlike an array.
  await page.goto(`${base}?c=${encode({})}`);
  assert.equal(await page.inputValue('#inp-nickname'), '');
  await page.goto(`${base}?c=${encode({ n: '유효링크' })}&lang=unsupported`);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.inputValue('#inp-nickname'), '유효링크');
});
