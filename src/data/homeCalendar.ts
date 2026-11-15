import events from './homeCalendar.json';
import { addDays, matchesDate, type CalendarSchedule, type CharacterDay } from './characterDaySchedule';
export { todayInSeoul } from './characterDaySchedule';

export type HomeCalendarEvent = Pick<CharacterDay, 'id' | 'label' | 'tag' | 'characterIds'> & {
  schedule: Omit<CalendarSchedule, 'rule'>;
};

export function getFeaturedEvents(today: Date): HomeCalendarEvent[] {
  for (let offset = 0; offset <= 14; offset += 1) {
    const date = addDays(today, offset);
    const matching = (events as HomeCalendarEvent[]).filter(event => matchesDate(event, date));
    if (matching.length) return matching.slice(0, 3);
  }
  return [];
}
