import source from './characterDays.json';

export type CalendarSchedule = {
  type: 'yearly' | 'year-month' | 'monthly' | 'weekly' | 'historic';
  rule: string;
  date: string | null;
  monthDays?: number[];
  weekDays?: string[];
  months?: number[];
};

export type CharacterDay = {
  id: string;
  label: string;
  tag: string;
  aliases: string[];
  characterIds: string[];
  schedule: CalendarSchedule;
  sourceUrl: string | null;
  dateText: string;
};

export const CHARACTER_DAYS: CharacterDay[] = source.records as CharacterDay[];
export const CHARACTER_DAYS_CHECKED_AT = source.checkedAt;
export const CHARACTER_DAYS_SOURCE_URL = 'https://dic.pixiv.net/a/%E6%9D%B1%E6%96%B9%E3%82%AD%E3%83%A3%E3%83%A9%E3%81%AE%E6%97%A5';

const WEEKDAY_TO_ICAL: Record<number, string> = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' };
const pad = (value: number) => String(value).padStart(2, '0');

function matchesDate(event: CharacterDay, date: Date): boolean {
  const { schedule } = event;
  if (schedule.type === 'yearly') {
    const occurrence = schedule.date ? dateFromKey(schedule.date) : null;
    return occurrence?.getMonth() === date.getMonth() && occurrence.getDate() === date.getDate();
  }
  if (schedule.type === 'monthly') return schedule.monthDays?.includes(date.getDate()) ?? false;
  if (schedule.type === 'weekly') return schedule.weekDays?.includes(WEEKDAY_TO_ICAL[date.getDay()]) ?? false;
  return false;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function todayInSeoul(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value);
  return new Date(part('year'), part('month') - 1, part('day'));
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

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
