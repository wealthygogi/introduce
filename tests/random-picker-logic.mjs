import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

let server;
let drawPool;
let storage;
let prefs;
let categories;
let portraits;
let revealEffects;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  });
  drawPool = await server.ssrLoadModule('/src/features/characters/random/drawPool.ts');
  storage = await server.ssrLoadModule('/src/features/characters/random/randomPickerStorage.ts');
  prefs = await server.ssrLoadModule('/src/features/characters/random/preferenceSignals.ts');
  categories = await server.ssrLoadModule('/src/features/characters/characterCategories.ts');
  portraits = await server.ssrLoadModule('/src/data/characterPortraits.ts');
  revealEffects = await server.ssrLoadModule('/src/features/characters/random/revealEffects.ts');
});

after(() => server?.close());

const signals = (favorite = [], interested = [], avoid = [], warning = false) => ({
  favorite: new Set(favorite), interested: new Set(interested), avoid: new Set(avoid), warning,
});
const zeroRng = () => 0;

test('default pool is large and ignores signals when personalization is off', () => {
  const pool = drawPool.buildPool(drawPool.defaultRandomSettings(), signals([], [], [], true));
  assert.ok(pool.entries.length > 100);
  assert.ok(pool.entries.every(({ character }) => portraits.getCharacterPortrait(character).src !== null));
  assert.ok(pool.entries.every(entry => entry.weight === 1));
  assert.equal(pool.excludedByPreference, 0);
  assert.equal(pool.warning, false);
});

test('draw counts return unique characters and clamp to pool size', () => {
  assert.deepEqual(drawPool.DRAW_COUNTS, [1, 3, 5, 10]);
  const entries = drawPool.buildPool(drawPool.defaultRandomSettings()).entries;
  for (const count of drawPool.DRAW_COUNTS) {
    const outcome = drawPool.drawCharacters({ ...drawPool.buildPool(drawPool.defaultRandomSettings()), entries }, count, 'pool', zeroRng);
    assert.equal(outcome.characters.length, count);
    assert.equal(new Set(outcome.characters.map(character => character.id)).size, count);
  }
  const tiny = { entries: entries.slice(0, 2), relaxedRecent: false };
  const clamped = drawPool.drawCharacters(tiny, 5, 'pool', zeroRng);
  assert.equal(clamped.characters.length, 2);
  assert.equal(clamped.clamped, true);
});

test('each draw randomly composes an effect from all fifteen game-series themes', () => {
  assert.equal(revealEffects.SERIES_REVEAL_THEMES.length, 15);
  assert.deepEqual(revealEffects.SERIES_REVEAL_THEMES.map(theme => theme.id), Array.from({ length: 15 }, (_, index) => `th${index + 6}`));
  assert.deepEqual(revealEffects.createRandomRevealPlan(() => 0), {
    series: revealEffects.SERIES_REVEAL_THEMES[0], opening: 'seal', motion: 'flip', finish: 'petals',
  });
  assert.deepEqual(revealEffects.createRandomRevealPlan(() => 0.99999), {
    series: revealEffects.SERIES_REVEAL_THEMES[14], opening: 'cards', motion: 'flare', finish: 'rays',
  });
});

test('stage filters work without a role and combine with roles on one appearance', () => {
  const defaults = drawPool.defaultRandomSettings();
  const stageOnly = drawPool.buildPool({ ...defaults, stage: 1 });
  assert.ok(stageOnly.entries.length > 0);
  assert.ok(stageOnly.entries.every(({ character }) => categories.allAppearances(character.id).some(appearance => appearance.stage === 1)));

  const bossOnStageOne = drawPool.buildPool({ ...defaults, roles: ['boss'], stage: 1 });
  assert.ok(bossOnStageOne.entries.length > 0);
  assert.ok(bossOnStageOne.entries.every(({ character }) => categories.allAppearances(character.id).some(appearance => appearance.stage === 1 && appearance.role === 'boss')));
});

test('preference weights, exclusions, and favorite precedence are correct', () => {
  const defaults = drawPool.defaultRandomSettings();
  const baseline = drawPool.buildPool(defaults).entries;
  const [fav, interested, avoided, sole] = baseline.slice(0, 4).map(entry => entry.character.id);
  const settings = { ...defaults, reflectPreferences: true, excludeRecent: false };
  const result = drawPool.buildPool(settings, signals([fav, sole], [interested, sole], [avoided, sole]));
  const byId = new Map(result.entries.map(entry => [entry.character.id, entry]));
  assert.equal(byId.get(fav).weight, 3);
  assert.equal(byId.get(interested).weight, 1.5);
  assert.equal(byId.has(avoided), false);
  assert.equal(byId.get(sole).weight, 3);
  assert.equal(result.excludedByPreference, 1);

  const only = drawPool.buildPool(settings, signals([], [], baseline.slice(1).map(entry => entry.character.id)));
  assert.deepEqual(only.entries.map(entry => entry.character.id), [baseline[0].character.id]);
});

test('recent ids are newest-first unique and capped; exclusion relaxes when needed', () => {
  const recent = drawPool.recentCharacterIds([
    { characterIds: ['a', 'b', 'a'] }, { characterIds: ['c', 'b', 'd'] },
  ]);
  assert.deepEqual(recent, ['a', 'b', 'c', 'd']);
  assert.deepEqual(drawPool.recentCharacterIds([{ characterIds: ['a'] }], 0), []);
  assert.equal(drawPool.recentCharacterIds([{ characterIds: Array.from({ length: 15 }, (_, index) => `id-${index}`) }]).length, 10);

  const defaults = drawPool.defaultRandomSettings();
  const ids = drawPool.buildPool(defaults).entries.slice(0, 3).map(entry => entry.character.id);
  const filtered = drawPool.buildPool({ ...defaults, count: 3 }, null, ids.slice(0, 1));
  assert.ok(filtered.entries.every(entry => entry.character.id !== ids[0]));
  const smallSettings = { ...defaults, scope: 'mainline', roles: ['other'], count: 5 };
  const smallIds = drawPool.buildPool(smallSettings).entries.map(entry => entry.character.id);
  const relaxed = drawPool.buildPool(smallSettings, null, smallIds);
  assert.equal(relaxed.relaxedRecent, true);
  assert.ok(smallIds.every(id => relaxed.entries.some(entry => entry.character.id === id)));
});

test('balanced drawing spreads across groups before repeating a group', () => {
  const entries = Array.from({ length: 6 }, (_, index) => ({
    id: `c${index}`, group: { ko: `그룹${Math.floor(index / 2)}` }, groupKey: `group-${Math.floor(index / 2)}`,
    character: { id: `c${index}` }, weight: 1,
  }));
  const outcome = drawPool.drawCharacters({ entries, relaxedRecent: false }, 3, 'balanced', zeroRng);
  assert.equal(outcome.characters.length, 3);
  assert.equal(new Set(outcome.characters.map(character => character.id)).size, 3);
  assert.equal(new Set(outcome.characters.map(character => Math.floor(Number(character.id.slice(1)) / 2))).size, 3);
});

test('storage round-trips, validates history, and handles storage failures', () => {
  const data = storage.createDefaultRandomPicker();
  const first = drawPool.buildPool(drawPool.defaultRandomSettings()).entries[0].character.id;
  const record = { id: 'draw-1', at: 1, characterIds: [first], count: 1, mode: 'pool' };
  data.history = [record];
  const serialized = storage.serializeRandomPicker(data);
  assert.equal(JSON.parse(serialized).version, 1);
  assert.deepEqual(storage.parseRandomPicker(serialized), { kind: 'valid', data });
  const legacyPairSettings = JSON.parse(serialized);
  legacyPairSettings.data.settings.count = 2;
  legacyPairSettings.data.history[0].requested = 2;
  const migrated = storage.parseRandomPicker(JSON.stringify(legacyPairSettings));
  assert.equal(migrated.kind, 'valid');
  if (migrated.kind === 'valid') {
    assert.equal(migrated.data.settings.count, 3, 'legacy pair count migrates to the next available draw size');
    assert.equal(migrated.data.history[0].requested, 2, 'old history retains the original requested count');
  }
  const mutate = update => {
    const parsed = JSON.parse(serialized);
    update(parsed);
    return storage.parseRandomPicker(JSON.stringify(parsed));
  };
  assert.equal(mutate(parsed => { parsed.version = 2; }).kind, 'invalid');
  assert.equal(mutate(parsed => { parsed.data.history[0].characterIds = ['unknown']; }).kind, 'invalid');
  assert.equal(mutate(parsed => { parsed.data.history[0].characterIds = [first, first]; parsed.data.history[0].count = 2; }).kind, 'invalid');
  assert.equal(mutate(parsed => { parsed.data.history[0].count = 2; }).kind, 'invalid');
  assert.equal(mutate(parsed => { parsed.data.history.push(...Array.from({ length: 50 }, (_, index) => ({ ...record, id: `extra-${index}` }))); }).kind, 'invalid');
  assert.equal(mutate(parsed => { parsed.data.history.push({ ...record }); }).kind, 'invalid');

  const history = Array.from({ length: 55 }, (_, index) => ({ ...record, id: `id-${index}` }));
  const appended = storage.appendHistory(history, { ...record, id: 'newest' });
  assert.equal(appended.length, storage.MAX_RANDOM_HISTORY);
  assert.equal(appended[0].id, 'newest');
  assert.equal(appended.at(-1).id, 'id-48');

  assert.equal(storage.readRandomPicker({ getItem: () => null }).kind, 'empty');
  assert.equal(storage.readRandomPicker({ getItem: () => { throw new Error('blocked'); } }).kind, 'unavailable');
  assert.equal(storage.writeRandomPicker({ setItem: () => { throw new Error('blocked'); } }, data), false);
  assert.ok(storage.createDrawId());
  assert.notEqual(storage.createDrawId(), storage.createDrawId());
});

test('preference aggregation combines taste-board and coupling markers', () => {
  const [favorite, interested, avoided, contested, other] = drawPool.buildPool(drawPool.defaultRandomSettings()).entries.slice(0, 5).map(entry => entry.character.id);
  const result = prefs.collectPreferenceSignals({
    tasteBoard: { groups: [
      { titlePreset: { kind: 'favorites' }, cells: [{ characters: [favorite, contested] }] },
      { titlePreset: { kind: 'collection' }, cells: [{ characters: [interested, avoided] }] },
    ] },
    whiteboard: { edges: [{ from: favorite, to: avoided, preference: 'avoid' }], nodes: [] },
    keyboard: { edges: [{ a: interested, b: other, preference: 'favorite' }] },
    pairs: { pairs: [{ a: contested, b: other, preference: 'avoid' }] },
    matrix: { directed: [], unordered: [{ from: favorite, to: other, preference: 'favorite' }] },
  }, true);
  assert.ok(result.favorite.has(favorite));
  assert.ok(result.favorite.has(interested));
  assert.ok(result.favorite.has(other));
  assert.ok(result.avoid.has(avoided));
  assert.ok(!result.avoid.has(favorite));
  assert.ok(!result.avoid.has(contested));
  assert.ok(!result.interested.has(avoided));
  assert.equal(result.warning, true);
});
