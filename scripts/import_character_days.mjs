#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/import_character_days.mjs <touhou_chara_no_hi.ics>');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src/data/profileCatalog.json'), 'utf8'));
const characters = catalog.characters;
const normalize = value => value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const koIds = new Map(characters.map(character => [normalize(character.ko), character.id]));
const jaIds = new Map(characters.map(character => [normalize(character.ja), character.id]));
const unescapeText = value => value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
const property = (event, name) => {
  const line = event.split('\n').find(value => value.startsWith(`${name}:`));
  return line ? unescapeText(line.slice(name.length + 1)) : '';
};
const recurrence = event => event.split('\n').find(value => value.startsWith('RRULE:'))?.slice(6) ?? '';
const ymd = value => /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : null;

const ics = fs.readFileSync(input, 'utf8').replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '');
const events = ics.split('BEGIN:VEVENT').slice(1).map(block => block.split('END:VEVENT')[0]);
const records = events.map(event => {
  const summary = property(event, 'SUMMARY');
  const separator = summary.indexOf(' — ');
  const label = separator < 0 ? summary : summary.slice(0, separator);
  const tag = separator < 0 ? summary : summary.slice(separator + 3);
  const description = property(event, 'DESCRIPTION');
  const characterLine = description.match(/캐릭터:\s*([^\n]+)/)?.[1] ?? '';
  const characterIds = new Set();
  for (const [, name] of characterLine.matchAll(/\(([^()]*)\)/g)) {
    const id = koIds.get(normalize(name));
    if (id) characterIds.add(id);
  }
  for (const name of characterLine.split(/[ /／]+/).map(value => value.trim()).filter(Boolean)) {
    const id = jaIds.get(normalize(name));
    if (id) characterIds.add(id);
  }
  const rule = recurrence(event);
  const dateMatch = event.match(/^DTSTART(?:;VALUE=DATE)?:([0-9T]+)$/m);
  const ruleType = rule.startsWith('FREQ=YEARLY;BYMONTH=') ? 'year-month'
    : rule.startsWith('FREQ=YEARLY') ? 'yearly'
      : rule.startsWith('FREQ=MONTHLY;BYMONTHDAY=') ? 'monthly'
        : rule.startsWith('FREQ=WEEKLY;BYDAY=') ? 'weekly'
          : 'historic';
  const schedule = { type: ruleType, rule, date: dateMatch ? ymd(dateMatch[1].slice(0, 8)) : null };
  if (ruleType === 'monthly') schedule.monthDays = rule.match(/BYMONTHDAY=([^;]+)/)?.[1].split(',').map(Number) ?? [];
  if (ruleType === 'weekly') schedule.weekDays = rule.match(/BYDAY=([^;]+)/)?.[1].split(',') ?? [];
  if (ruleType === 'year-month') schedule.months = rule.match(/BYMONTH=([^;]+)/)?.[1].split(',').map(Number) ?? [];
  const aliases = [...description.matchAll(/•\s*([^\n]+?)\s+https?:\/\/dic\.pixiv\.net\/a\/[^\s]+/g)].map(match => match[1].trim());
  const sourceUrl = property(event, 'URL') || null;
  const dateText = description.match(/원본 날짜 표기:\s*([^\n]+)/)?.[1]?.trim() ?? '';
  return {
    id: property(event, 'UID').replace(/@.*$/, ''),
    label,
    tag,
    aliases: [...new Set([tag, ...aliases])],
    characterIds: [...characterIds],
    schedule,
    sourceUrl,
    dateText,
  };
});

const output = path.join(root, 'src/data/characterDays.json');
fs.writeFileSync(output, `${JSON.stringify({ source: 'pixiv百科事典「東方キャラの日」経由のv1.0.0 ICS', checkedAt: '2026-05-25', records }, null, 2)}\n`);
const counts = records.reduce((result, record) => {
  result[record.schedule.type] = (result[record.schedule.type] ?? 0) + 1;
  return result;
}, {});
const noMappedCharacter = records.filter(record => record.characterIds.length === 0).length;
console.log(`Imported ${records.length} records (${JSON.stringify(counts)}); ${noMappedCharacter} records have no mapped catalog character. Wrote ${path.relative(root, output)}.`);
