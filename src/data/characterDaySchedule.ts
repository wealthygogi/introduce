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

const WEEKDAY_TO_ICAL: Record<number, string> = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' };
const pad = (value: number) => String(value).padStart(2, '0');

export function matchesDate(event: { schedule: Omit<CalendarSchedule, 'rule'> }, date: Date): boolean {
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
