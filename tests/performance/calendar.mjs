import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { createServer as createHttpServer } from 'node:http';

test('home calendar preserves original results across ordinary and leap years', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: { server: createHttpServer() } }, appType: 'custom' });
  try {
    const { getFeaturedEvents } = await server.ssrLoadModule('/src/data/homeCalendar.ts');
    const { todayInSeoul } = await server.ssrLoadModule('/src/data/characterDaySchedule.ts');
    const { records } = JSON.parse(await readFile(new URL('../../src/data/characterDays.json', import.meta.url), 'utf8'));
    // Independent reference of the original date rules, rather than the extracted matcher.
    const forDate = date => records.filter(({ schedule: s }) => {
      if (s.type === 'yearly') {
        const occurrence = s.date ? new Date(`${s.date}T00:00:00`) : null;
        return occurrence?.getMonth() === date.getMonth() && occurrence.getDate() === date.getDate();
      }
      if (s.type === 'monthly') return s.monthDays?.includes(date.getDate());
      if (s.type === 'weekly') return s.weekDays?.includes(['SU','MO','TU','WE','TH','FR','SA'][date.getDay()]);
      return false;
    });
    for (const year of [2024, 2026]) {
      for (let day = new Date(year, 0, 1); day.getFullYear() === year; day.setDate(day.getDate() + 1)) {
        let expected = [];
        for (let offset = 0; offset <= 14; offset++) {
          const date = new Date(day.getFullYear(), day.getMonth(), day.getDate() + offset);
          expected = forDate(date).slice(0, 3);
          if (expected.length) break;
        }
        assert.deepEqual(getFeaturedEvents(day).map(x => x.id), expected.map(x => x.id), day.toDateString());
      }
    }
    assert.equal(todayInSeoul(new Date('2026-12-31T14:59:59Z')).getFullYear(), 2026);
    const nextYear = todayInSeoul(new Date('2026-12-31T15:00:00Z'));
    assert.equal(nextYear.getFullYear(), 2027);
    assert.equal(nextYear.getMonth(), 0);
    assert.equal(nextYear.getDate(), 1);
  } finally { await server.close(); }
});
