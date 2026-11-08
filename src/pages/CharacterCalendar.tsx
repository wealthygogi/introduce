import { useMemo, useState } from 'react';
import { useLang } from '../contexts/LangContext';
import { getCharacterPortrait } from '../data/characterPortraits';
import { PROFILE_CHARACTERS, PROFILE_CHARACTER_BY_ID } from '../data/profileCatalog';
import {
  addDays,
  CHARACTER_DAYS,
  CHARACTER_DAYS_CHECKED_AT,
  CHARACTER_DAYS_SOURCE_URL,
  dateKey,
  getCharacterDaysForDate,
  getMonthCharacterDays,
  getNextCharacterDays,
  getPixivSearchUrl,
  getXSearchUrl,
  todayInSeoul,
  type CharacterDay,
} from '../data/characterDays';
import '../styles/character-calendar.css';

type View = 'today' | 'week' | 'month' | 'characters';

const copy = {
  ko: {
    eyebrow: 'GENSOKYO · CALENDAR', title: '오늘, 환상향에서는', intro: '팬덤이 정한 기념일과 그날의 창작 태그를 찾아보세요.',
    today: '오늘', week: '주간', month: '월간', characters: '캐릭터별', todayButton: '오늘로', previous: '이전', next: '다음',
    todayDays: '오늘의 기념일', empty: '오늘 등록된 날짜 기념일은 없어요.', nextUp: '가까운 기념일', inMonth: '이번 달 진행 중', noMonth: '이번 달 진행 중인 월간 기념일이 없어요.',
    searchPixiv: 'pixiv 일러스트 검색', searchX: 'X 이미지 검색', source: '원문 보기', tag: '태그', tags: '태그 표기',
    calendarDay: '날짜별 기념일', pickDate: '날짜를 선택하면 그날의 기념일을 볼 수 있어요.', characterPick: '캐릭터를 선택하세요', characterHint: '얼굴을 선택하면 다가오는 기념일과 태그를 확인할 수 있어요.',
    upcomingFor: '다가오는 기념일', noCharacterEvents: '연결된 기념일을 찾지 못했어요.', unknownCharacter: '캐릭터 정보 미연결',
    fanNote: '팬덤이 정한 2차 창작 이벤트 태그이며, 공식 생일이 아닐 수 있습니다.', sourceNote: '출처: pixiv 백과사전 「東方キャラの日」 기반 · 데이터 확인',
    days: ['일', '월', '화', '수', '목', '금', '토'], date: (date: Date) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date),
    monthDate: (date: Date) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(date), entries: (count: number) => `기념일 ${count}개`, noMatches: '찾은 캐릭터가 없습니다.',
  },
  ja: {
    eyebrow: 'GENSOKYO · CALENDAR', title: '今日、幻想郷では', intro: 'ファンが決めた記念日と、その日の創作タグを見つけましょう。',
    today: '今日', week: '週間', month: '月間', characters: 'キャラクター別', todayButton: '今日へ', previous: '前へ', next: '次へ',
    todayDays: '今日の記念日', empty: '今日の記念日はありません。', nextUp: '近日の記念日', inMonth: '今月開催中', noMonth: '今月開催中の月間記念日はありません。',
    searchPixiv: 'pixivでイラスト検索', searchX: 'Xで画像検索', source: '記事を見る', tag: 'タグ', tags: 'タグ表記',
    calendarDay: '日付ごとの記念日', pickDate: '日付を選ぶと、その日の記念日を表示します。', characterPick: 'キャラクターを選択', characterHint: '顔を選ぶと、近日の記念日とタグを確認できます。',
    upcomingFor: '近日の記念日', noCharacterEvents: '関連する記念日は見つかりませんでした。', unknownCharacter: 'キャラクター情報なし',
    fanNote: 'ファンによる二次創作イベントタグで、公式の誕生日ではない場合があります。', sourceNote: '出典: pixiv百科事典「東方キャラの日」 · データ確認',
    days: ['日', '月', '火', '水', '木', '金', '土'], date: (date: Date) => new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(date),
    monthDate: (date: Date) => new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(date), entries: (count: number) => `記念日 ${count}件`, noMatches: 'キャラクターが見つかりません。',
  },
  en: {
    eyebrow: 'GENSOKYO · CALENDAR', title: 'Today in Gensokyo', intro: 'Discover fan-made celebration days and the creative tags around them.',
    today: 'Today', week: 'Week', month: 'Month', characters: 'Characters', todayButton: 'Today', previous: 'Previous', next: 'Next',
    todayDays: 'Today’s celebrations', empty: 'No fixed-date celebrations are listed for today.', nextUp: 'Coming up', inMonth: 'This month', noMonth: 'No month-long celebrations are listed this month.',
    searchPixiv: 'Find illustrations on pixiv', searchX: 'Search images on X', source: 'Open source', tag: 'Tag', tags: 'Tag variants',
    calendarDay: 'Days and celebrations', pickDate: 'Choose a date to see its celebrations.', characterPick: 'Choose a character', characterHint: 'Choose a portrait to find upcoming celebration days and tags.',
    upcomingFor: 'Upcoming celebrations', noCharacterEvents: 'No linked celebrations were found.', unknownCharacter: 'Character not linked',
    fanNote: 'These are fan-made event tags and may not represent official birthdays.', sourceNote: 'Source: pixiv encyclopedia “東方キャラの日” · Data checked',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], date: (date: Date) => new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(date),
    monthDate: (date: Date) => new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long' }).format(date), entries: (count: number) => `${count} celebration${count === 1 ? '' : 's'}`, noMatches: 'No matching characters.',
  },
} as const;
type CalendarCopy = (typeof copy)[keyof typeof copy];

function getLocaleToday(): Date {
  return todayInSeoul();
}

function shiftDate(date: Date, view: View, amount: number): Date {
  if (view === 'month') return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  if (view === 'week') return addDays(date, amount * 7);
  return addDays(date, amount);
}

function weekDates(date: Date): Date[] {
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = addDays(date, -mondayOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function Face({ id, size = 'normal' }: { id: string; size?: 'small' | 'normal' | 'large' }) {
  const character = PROFILE_CHARACTER_BY_ID.get(id);
  if (!character) return <span className={`calendar-face calendar-face-${size} calendar-face-fallback`} aria-hidden="true">東</span>;
  const portrait = getCharacterPortrait(character);
  return <span className={`calendar-face calendar-face-${size}`} title={character.ko}>
    {portrait.src ? <img src={portrait.src} alt="" loading="lazy" /> : <span aria-hidden="true">{character.ko.slice(0, 1)}</span>}
  </span>;
}

function EventFaces({ event, size = 'normal' }: { event: CharacterDay; size?: 'small' | 'normal' | 'large' }) {
  const ids = event.characterIds.slice(0, 4);
  return <span className="calendar-face-stack" aria-label={ids.map(id => PROFILE_CHARACTER_BY_ID.get(id)?.ko).filter(Boolean).join('、')}>
    {ids.map(id => <Face key={id} id={id} size={size} />)}
    {event.characterIds.length > ids.length && <span className="calendar-face-more">+{event.characterIds.length - ids.length}</span>}
  </span>;
}

function EventCard({ event, lang, labels, compact = false }: { event: CharacterDay; lang: 'ko' | 'ja' | 'en'; labels: CalendarCopy; compact?: boolean }) {
  const characters = event.characterIds.map(id => PROFILE_CHARACTER_BY_ID.get(id)).filter(Boolean);
  return <article className={`calendar-event${compact ? ' calendar-event-compact' : ''}`}>
    <div className="calendar-event-head">
      <EventFaces event={event} size={compact ? 'small' : 'normal'} />
      <div className="calendar-event-title"><h3>{event.label}</h3><p>{characters.length ? characters.map(character => character?.[lang]).join(' · ') : labels.unknownCharacter}</p></div>
    </div>
    <p className="calendar-event-tag" lang="ja">{event.tag}</p>
    {!compact && event.aliases.length > 1 && <details className="calendar-aliases"><summary>{labels.tags} · {event.aliases.length}</summary><ul>{event.aliases.map(alias => <li key={alias}>{alias}</li>)}</ul></details>}
    <div className="calendar-event-actions">
      <a href={getPixivSearchUrl(event.tag)} target="_blank" rel="noopener noreferrer">{labels.searchPixiv} <span aria-hidden="true">↗</span></a>
      <a href={getXSearchUrl(event.tag)} target="_blank" rel="noopener noreferrer">{labels.searchX} <span aria-hidden="true">↗</span></a>
      {event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">{labels.source} <span aria-hidden="true">↗</span></a>}
    </div>
  </article>;
}

function EventDateHeading({ date, lang, title }: { date: Date; lang: 'ko' | 'ja' | 'en'; title: string }) {
  return <div className="calendar-section-heading"><h2>{title}</h2><time dateTime={dateKey(date)}>{new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en', { month: 'short', day: 'numeric', weekday: 'short' }).format(date)}</time></div>;
}

export default function CharacterCalendar() {
  const { lang } = useLang();
  const t = copy[lang];
  const [view, setView] = useState<View>('today');
  const [selectedDate, setSelectedDate] = useState(getLocaleToday);
  const [characterQuery, setCharacterQuery] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const monthDays = useMemo(() => getMonthCharacterDays(selectedDate), [selectedDate]);
  const monthLabel = t.monthDate(selectedDate);
  const featuredCharacterIds = useMemo(() => new Set(CHARACTER_DAYS.flatMap(event => event.characterIds)), []);
  const characterOptions = useMemo(() => PROFILE_CHARACTERS.filter(character => featuredCharacterIds.has(character.id)
    && (!characterQuery || `${character.ko} ${character.ja} ${character.en}`.toLocaleLowerCase().includes(characterQuery.toLocaleLowerCase()))), [characterQuery, featuredCharacterIds]);
  const chosenCharacter = selectedCharacterId ? PROFILE_CHARACTER_BY_ID.get(selectedCharacterId) : undefined;
  const characterEvents = useMemo(() => selectedCharacterId ? getNextCharacterDays(selectedDate, selectedCharacterId, 16) : [], [selectedDate, selectedCharacterId]);
  const selectedEvents = getCharacterDaysForDate(selectedDate);
  const days = useMemo(() => weekDates(selectedDate), [selectedDate]);
  const monthCells = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = addDays(first, -mondayOffset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [selectedDate]);
  const resetToToday = () => setSelectedDate(getLocaleToday());

  return <div className="calendar-page">
    <header className="calendar-hero">
      <div><span className="modes-eyebrow">{t.eyebrow}</span><h1>{t.title}</h1><p>{t.intro}</p></div>
      <div className="calendar-hero-stamp" aria-hidden="true"><span>東</span><i>CALENDAR</i></div>
    </header>

    <div className="calendar-toolbar">
      <div className="calendar-tabs" role="tablist" aria-label={t.title}>
        {(['today', 'week', 'month', 'characters'] as const).map(tab => <button key={tab} type="button" role="tab" aria-selected={view === tab} className={view === tab ? 'is-active' : ''} onClick={() => setView(tab)}>{t[tab]}</button>)}
      </div>
      <div className="calendar-date-controls">
        {view !== 'characters' && <><button type="button" aria-label={t.previous} onClick={() => setSelectedDate(current => shiftDate(current, view, -1))}>←</button><strong>{view === 'month' ? monthLabel : view === 'week' ? `${t.date(days[0])} – ${t.date(days[6])}` : t.date(selectedDate)}</strong><button type="button" aria-label={t.next} onClick={() => setSelectedDate(current => shiftDate(current, view, 1))}>→</button></>}
        {view === 'characters' && <strong>{t.characters}</strong>}
        <button type="button" className="calendar-today-button" onClick={resetToToday}>{t.todayButton}</button>
      </div>
    </div>

    {view === 'today' && <>
      <section className="calendar-today-layout">
        <div className="calendar-today-main">
          <div className="calendar-section-heading"><h2>{t.todayDays}</h2><time dateTime={dateKey(selectedDate)}>{t.date(selectedDate)}</time></div>
          {selectedEvents.length ? <div className="calendar-event-list">{selectedEvents.map(event => <EventCard key={event.id} event={event} lang={lang} labels={t} />)}</div> : <div className="calendar-empty"><span aria-hidden="true">☾</span><p>{t.empty}</p></div>}
        </div>
        <aside className="calendar-aside">
          <section className="calendar-aside-section"><h2>{t.nextUp}</h2><div className="calendar-upcoming-list">{Array.from({ length: 7 }, (_, index) => addDays(selectedDate, index + 1)).map(date => {
            const events = getCharacterDaysForDate(date);
            return events.length ? <button type="button" className="calendar-upcoming-day" key={dateKey(date)} onClick={() => setSelectedDate(date)}><time dateTime={dateKey(date)}>{new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric' }).format(date)}</time><span><EventFaces event={events[0]} size="small" />{events.length > 1 && <small>+{events.length - 1}</small>}</span></button> : null;
          })}</div></section>
          <section className="calendar-aside-section"><h2>{t.inMonth}</h2>{monthDays.length ? <div className="calendar-month-event-list">{monthDays.map(event => <article key={event.id}><EventFaces event={event} size="small" /><span>{event.label}</span></article>)}</div> : <p className="calendar-muted">{t.noMonth}</p>}</section>
        </aside>
      </section>
    </>}

    {view === 'week' && <section className="calendar-week-view" aria-label={t.week}>
      {days.map(date => {
        const events = getCharacterDaysForDate(date);
        return <section className={`calendar-week-day${dateKey(date) === dateKey(getLocaleToday()) ? ' is-today' : ''}`} key={dateKey(date)}>
          <EventDateHeading date={date} lang={lang} title={new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(date)} />
          {events.length ? events.map(event => <EventCard key={event.id} event={event} lang={lang} labels={t} compact />) : <p className="calendar-week-empty">—</p>}
        </section>;
      })}
    </section>}

    {view === 'month' && <section className="calendar-month-view" aria-label={t.month}>
      <div className="calendar-weekday-headings">{t.days.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="calendar-month-grid">{monthCells.map(date => {
        const events = getCharacterDaysForDate(date);
        const inMonth = date.getMonth() === selectedDate.getMonth();
        return <button type="button" key={dateKey(date)} className={`calendar-month-cell${inMonth ? '' : ' is-outside'}${dateKey(date) === dateKey(selectedDate) ? ' is-selected' : ''}${dateKey(date) === dateKey(getLocaleToday()) ? ' is-today' : ''}`} onClick={() => setSelectedDate(date)} aria-label={`${t.date(date)}, ${t.entries(events.length)}`}>
          <time dateTime={dateKey(date)}>{date.getDate()}</time>
          <span className="calendar-month-faces">{events.slice(0, 3).map(event => <EventFaces key={event.id} event={event} size="small" />)}{events.length > 3 && <small>+{events.length - 3}</small>}</span>
          <span className="calendar-month-count">{events.length ? events.length : ''}</span>
        </button>;
      })}</div>
      <div className="calendar-month-detail"><EventDateHeading date={selectedDate} lang={lang} title={t.calendarDay} />
        {selectedEvents.length ? <div className="calendar-event-list">{selectedEvents.map(event => <EventCard key={event.id} event={event} lang={lang} labels={t} compact />)}</div> : <p className="calendar-muted">{t.pickDate}</p>}
        {!!monthDays.length && <div className="calendar-month-long"><h3>{t.inMonth}</h3>{monthDays.map(event => <EventCard key={event.id} event={event} lang={lang} labels={t} compact />)}</div>}
      </div>
    </section>}

    {view === 'characters' && <section className="calendar-character-view">
      <div className="calendar-character-picker"><label htmlFor="calendar-character-search">{t.characterPick}</label><input id="calendar-character-search" type="search" value={characterQuery} onChange={event => setCharacterQuery(event.target.value)} placeholder={lang === 'ko' ? '이름 검색…' : lang === 'ja' ? '名前で検索…' : 'Search names…'} />
        <div className="calendar-character-grid">{characterOptions.slice(0, 60).map(character => <button type="button" className={selectedCharacterId === character.id ? 'is-selected' : ''} key={character.id} onClick={() => setSelectedCharacterId(character.id)}><Face id={character.id} size="normal" /><span>{character[lang]}</span></button>)}{!characterOptions.length && <p>{t.noMatches}</p>}</div>
      </div>
      <div className="calendar-character-results">{chosenCharacter ? <>
        <header className="calendar-character-heading"><Face id={chosenCharacter.id} size="large" /><div><span>{chosenCharacter.group[lang]}</span><h2>{chosenCharacter[lang]}</h2><p>{t.characterHint}</p></div></header>
        <div className="calendar-section-heading"><h2>{t.upcomingFor}</h2><span>{t.date(selectedDate)}</span></div>
        {characterEvents.length ? <div className="calendar-event-list">{characterEvents.map(({ date, event }) => <div className="calendar-character-event" key={`${dateKey(date)}-${event.id}`}><time dateTime={dateKey(date)}>{t.date(date)}</time><EventCard event={event} lang={lang} labels={t} compact /></div>)}</div> : <p className="calendar-muted">{t.noCharacterEvents}</p>}
      </> : <div className="calendar-character-placeholder"><span aria-hidden="true">✳</span><p>{t.characterHint}</p></div>}</div>
    </section>}

    <footer className="calendar-source-note"><p>{t.fanNote}</p><a href={CHARACTER_DAYS_SOURCE_URL} target="_blank" rel="noopener noreferrer">{t.sourceNote} {CHARACTER_DAYS_CHECKED_AT} ↗</a><span>{CHARACTER_DAYS.length} entries</span></footer>
  </div>;
}
