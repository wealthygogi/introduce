import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile(new URL('../src/data/characterDays.json', import.meta.url), 'utf8'));
const events = source.records
  .filter(event => ['yearly', 'monthly', 'weekly'].includes(event.schedule.type))
  .map(({ id, label, tag, characterIds, schedule }) => ({
    id, label, tag, characterIds,
    schedule: {
      type: schedule.type,
      date: schedule.date,
      ...(schedule.monthDays ? { monthDays: schedule.monthDays } : {}),
      ...(schedule.weekDays ? { weekDays: schedule.weekDays } : {}),
    },
  }));
await writeFile(new URL('../src/data/homeCalendar.json', import.meta.url), JSON.stringify(events) + '\n');
