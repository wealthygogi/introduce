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
