import source from './characterDays.json';

import { addDays, matchesDate } from './characterDaySchedule';
import type { CharacterDay } from './characterDaySchedule';
export { addDays, dateKey, dateFromKey, todayInSeoul } from './characterDaySchedule';
export type { CharacterDay, CalendarSchedule } from './characterDaySchedule';

export const CHARACTER_DAYS: CharacterDay[] = source.records as CharacterDay[];
export const CHARACTER_DAYS_CHECKED_AT = source.checkedAt;
export const CHARACTER_DAYS_SOURCE_URL = 'https://dic.pixiv.net/a/%E6%9D%B1%E6%96%B9%E3%82%AD%E3%83%A3%E3%83%A9%E3%81%AE%E6%97%A5';

export function getCharacterDaysForDate(date: Date, characterId?: string): CharacterDay[] {
  return CHARACTER_DAYS.filter(event => {
    if (event.schedule.type === 'historic') return false;
    if (characterId && !event.characterIds.includes(characterId)) return false;
    return matchesDate(event, date);
  });
}

export function getMonthCharacterDays(date: Date, characterId?: string): CharacterDay[] {
  return CHARACTER_DAYS.filter(event => event.schedule.type === 'year-month'
    && event.schedule.months?.includes(date.getMonth() + 1)
    && (!characterId || event.characterIds.includes(characterId)));
}

export function getNextCharacterDays(from: Date, characterId: string, limit = 12): Array<{ date: Date; event: CharacterDay }> {
  const candidates = CHARACTER_DAYS.filter(event => event.schedule.type !== 'historic' && event.characterIds.includes(characterId));
  const results: Array<{ date: Date; event: CharacterDay }> = [];
  for (let offset = 0; offset < 370 && results.length < limit; offset += 1) {
    const date = addDays(from, offset);
    for (const event of candidates) {
      if (event.schedule.type === 'year-month' && date.getDate() === 1 && event.schedule.months?.includes(date.getMonth() + 1)) {
        results.push({ date, event });
      } else if (event.schedule.type !== 'year-month' && matchesDate(event, date)) {
        results.push({ date, event });
      }
    }
  }
  return results.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}

export function getPixivSearchUrl(tag: string): string {
  return `https://www.pixiv.net/tags/${encodeURIComponent(tag)}/illustrations`;
}

export function getXSearchUrl(tag: string): string {
  return `https://x.com/search?q=${encodeURIComponent(`#${tag}`)}&src=typed_query&f=live`;
}
