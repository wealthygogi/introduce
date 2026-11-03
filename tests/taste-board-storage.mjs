import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createDefaultTasteBoard,
  parseTasteBoard,
  readTasteBoard,
  serializeTasteBoard,
  TASTE_BOARD_STORAGE_KEY,
  writeTasteBoard,
} from '../src/features/characters/tasteBoardStorage.ts';

const characters = new Set(['reimu', 'marisa', 'sakuya']);

test('default board is a sparse 3 by 3 grid and round-trips without compacting empty cells', () => {
  const board = createDefaultTasteBoard();
  assert.equal(board.groups[0].rows, 3);
  assert.equal(board.groups[0].columns, 3);
  assert.deepEqual(board.groups[0].cells, Array(9).fill(null));

  board.groups[0].cells[0] = { characters: ['reimu'], label: '' };
  board.groups[0].cells[8] = { characters: ['marisa', 'sakuya'], label: 'Best duo' };
  const restored = parseTasteBoard(serializeTasteBoard(board), characters);
  assert.equal(restored.kind, 'valid');
  if (restored.kind === 'valid') assert.deepEqual(restored.data, board);
});

test('an empty group list is a valid saved board', () => {
  const board = createDefaultTasteBoard();
  board.groups = [];
  const restored = parseTasteBoard(serializeTasteBoard(board), characters);
  assert.equal(restored.kind, 'valid');
  if (restored.kind === 'valid') assert.deepEqual(restored.data.groups, []);
});

test('parser rejects future versions, unknown characters, and grids over the safety limit', () => {
  const board = createDefaultTasteBoard();
  assert.equal(parseTasteBoard(JSON.stringify({ version: 2, data: board }), characters).kind, 'invalid');

  const unknown = structuredClone(board);
  unknown.groups[0].cells[0] = { characters: ['unknown'], label: '' };
  assert.equal(parseTasteBoard(serializeTasteBoard(unknown), characters).kind, 'invalid');

  const tooLarge = structuredClone(board);
  tooLarge.groups[0] = { ...tooLarge.groups[0], rows: 11, columns: 10, cells: Array(110).fill(null) };
  assert.equal(parseTasteBoard(serializeTasteBoard(tooLarge), characters).kind, 'invalid');
});

test('same character may appear in different cells while a cell cannot duplicate its character', () => {
  const board = createDefaultTasteBoard();
  board.groups[0].cells[0] = { characters: ['reimu'], label: '' };
  board.groups[0].cells[1] = { characters: ['reimu'], label: '' };
  assert.equal(parseTasteBoard(serializeTasteBoard(board), characters).kind, 'valid');

  board.groups[0].cells[1] = { characters: ['reimu', 'reimu'], label: '' };
  assert.equal(parseTasteBoard(serializeTasteBoard(board), characters).kind, 'invalid');
});

test('cells may reference a custom image while old cells remain valid without one', () => {
  const board = createDefaultTasteBoard();
  board.groups[0].cells[0] = { characters: ['reimu'], label: '' };
  const legacy = parseTasteBoard(serializeTasteBoard(board), characters);
  assert.equal(legacy.kind, 'valid');

  board.groups[0].cells[0] = { characters: ['reimu'], label: '', imageId: 'image-reimu-1' };
  const restored = parseTasteBoard(serializeTasteBoard(board), characters);
  assert.equal(restored.kind, 'valid');
  if (restored.kind === 'valid') assert.equal(restored.data.groups[0].cells[0]?.imageId, 'image-reimu-1');

  board.groups[0].cells[0] = { characters: ['reimu'], label: '', imageId: '' };
  assert.equal(parseTasteBoard(serializeTasteBoard(board), characters).kind, 'invalid');
});

test('character versions round-trip independently and reject unrelated or malformed entries', () => {
  const board = createDefaultTasteBoard();
  board.groups[0].cells[0] = { characters: ['reimu', 'marisa'], label: '', imageId: 'photo-1', versionWorkIds: { reimu: 'th18', marisa: 'th6' } };
  assert.deepEqual(parseTasteBoard(serializeTasteBoard(board), characters), { kind: 'valid', data: board });
  for (const versions of [{ reimu: '' }, { reimu: 18 }, { sakuya: 'th18' }, { reimu: 'x'.repeat(121) }, []]) {
    const invalid = structuredClone(board);
    invalid.groups[0].cells[0].versionWorkIds = versions;
    assert.equal(parseTasteBoard(serializeTasteBoard(invalid), characters).kind, 'invalid');
  }
});

test('slot labels and appearance context survive v1 round-trip and malformed metadata is rejected', () => {
  const board = createDefaultTasteBoard();
  const group = board.groups[0];
  group.cells[0] = { characters: ['reimu', 'marisa'], label: 'duo', imageId: 'photo-1' };
  group.slots = [{ label: '홍마향', topicId: 'th6' }, { label: 'unknown', topicId: 'removed-topic' }, ...Array(7).fill(null)];
  group.showAppearances = true;
  group.appearanceContext = { topicId: 'mainline', role: 'boss', stage: 1 };
  assert.deepEqual(parseTasteBoard(serializeTasteBoard(board), characters), { kind: 'valid', data: board });
  for (const mutate of [
    g => { g.slots.pop(); },
    g => { g.slots[0].topicId = ''; },
    g => { g.slots[0].label = 'x'.repeat(81); },
    g => { g.showAppearances = 'yes'; },
    g => { g.appearanceContext.role = 'invalid'; },
    g => { g.appearanceContext.stage = 0; },
  ]) {
    const invalid = structuredClone(board);
    mutate(invalid.groups[0]);
    assert.equal(parseTasteBoard(serializeTasteBoard(invalid), characters).kind, 'invalid');
  }
});

test('storage uses an independent versioned key and reports blocked storage', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const board = createDefaultTasteBoard();
  assert.equal(writeTasteBoard(storage, board), true);
  assert.equal(values.has(TASTE_BOARD_STORAGE_KEY), true);
  assert.equal(readTasteBoard(storage, characters).kind, 'valid');
  assert.equal(readTasteBoard({ getItem() { throw new Error('blocked'); }, setItem() {} }, characters).kind, 'unavailable');
  assert.equal(writeTasteBoard({ getItem() { return null; }, setItem() { throw new Error('blocked'); } }, board), false);
});
test('legacy drafts remain byte-for-byte data-equivalent and optional provenance metadata validates', () => {
  const legacy = {
    version: 1,
    data: {
      title: 'Custom board', theme: 'paper', showNames: true,
      groups: [{
        id: 'legacy', title: 'Custom group', rows: 1, columns: 2,
        cells: [{ characters: ['reimu', 'marisa'], label: 'memo', imageId: 'photo-1', versionWorkIds: { reimu: 'th18' } }, null],
        slots: [{ label: '홍마향', topicId: 'th6' }, { label: 'unknown topic label', topicId: 'removed-topic' }],
      }],
    },
  };
  const parsed = parseTasteBoard(JSON.stringify(legacy), characters);
  assert.equal(parsed.kind, 'valid');
  if (parsed.kind === 'valid') assert.deepEqual(parsed.data, legacy.data);

  const board = createDefaultTasteBoard();
  board.groups[0].slots = [{ label: '동방홍마향', topicId: 'th6', labelSource: 'topic' }, ...Array(8).fill(null)];
  board.groups[0].slots[0].labelSource = 'custom';
  const restored = parseTasteBoard(serializeTasteBoard(board), characters);
  assert.equal(restored.kind, 'valid');
  if (restored.kind === 'valid') assert.deepEqual(restored.data, board);

  const invalid = mutate => {
    const data = structuredClone(board);
    mutate(data);
    assert.equal(parseTasteBoard(JSON.stringify({ version: 1, data }), characters).kind, 'invalid');
  };
  invalid(data => { data.titleSource = 'unknown'; });
  invalid(data => { data.groups[0].titleSource = 'auto'; delete data.groups[0].titlePreset; });
  invalid(data => { data.groups[0].titlePreset = { kind: 'unknown' }; });
  invalid(data => { data.groups[0].titlePreset = { kind: 'free', number: 0 }; });
  invalid(data => { data.groups[0].titlePreset = { kind: 'free', number: 1.5 }; });
  invalid(data => { data.groups[0].slots = [{ label: 'work', labelSource: 'topic' }, ...Array(8).fill(null)]; });
});
