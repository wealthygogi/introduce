import type { Lang } from './i18n';

export type SeriesGroup = 'old' | 'new' | 'extra';

export type Series = {
  id: string;
  num: string;
  group: SeriesGroup;
} & Record<Lang, string>;

export const SERIES: Series[] = [
  { id: 'th1', num: '01', ko: '영이전', ja: '靈異伝', en: 'HRtP', group: 'old' },
  { id: 'th2', num: '02', ko: '봉마록', ja: '封魔録', en: 'SoEW', group: 'old' },
  { id: 'th3', num: '03', ko: '몽시공', ja: '夢時空', en: 'PoDD', group: 'old' },
  { id: 'th4', num: '04', ko: '환상향', ja: '幻想郷', en: 'LLS', group: 'old' },
  { id: 'th5', num: '05', ko: '괴기담', ja: '怪綺談', en: 'MS', group: 'old' },
  { id: 'th6', num: '06', ko: '홍마향', ja: '紅魔郷', en: 'EoSD', group: 'new' },
  { id: 'th7', num: '07', ko: '요요몽', ja: '妖々夢', en: 'PCB', group: 'new' },
  { id: 'th8', num: '08', ko: '영야초', ja: '永夜抄', en: 'IN', group: 'new' },
  { id: 'th9', num: '09', ko: '화영총', ja: '花映塚', en: 'PoFV', group: 'new' },
  { id: 'th10', num: '10', ko: '풍신록', ja: '風神録', en: 'MoF', group: 'new' },
  { id: 'th11', num: '11', ko: '지령전', ja: '地霊殿', en: 'SA', group: 'new' },
  { id: 'th12', num: '12', ko: '성련선', ja: '星蓮船', en: 'UFO', group: 'new' },
  { id: 'th13', num: '13', ko: '신령묘', ja: '神霊廟', en: 'TD', group: 'new' },
  { id: 'th14', num: '14', ko: '휘침성', ja: '輝針城', en: 'DDC', group: 'new' },
  { id: 'th15', num: '15', ko: '감주전', ja: '紺珠伝', en: 'LoLK', group: 'new' },
  { id: 'th16', num: '16', ko: '천공장', ja: '天空璋', en: 'HSiFS', group: 'new' },
  { id: 'th17', num: '17', ko: '귀형수', ja: '鬼形獣', en: 'WBaWC', group: 'new' },
  { id: 'th18', num: '18', ko: '홍룡동', ja: '虹龍洞', en: 'UM', group: 'new' },
  { id: 'th19', num: '19', ko: '수왕원', ja: '獣王園', en: 'UDoaLG', group: 'new' },
  { id: 'th20', num: '20', ko: '금상경', ja: '錦上京', en: 'FW', group: 'new' },
  { id: 'manga', num: '', ko: '서적작', ja: '書籍作', en: 'Books/Manga', group: 'extra' },
  { id: 'music', num: '', ko: '음악작품', ja: '音楽作品', en: 'Music', group: 'extra' },
  { id: 'spinoff', num: '', ko: '스핀오프', ja: 'スピンオフ', en: 'Spin-offs', group: 'extra' },
];

export const SERIES_BY_GROUP: Record<SeriesGroup, Series[]> = {
  old: SERIES.filter((s) => s.group === 'old'),
  new: SERIES.filter((s) => s.group === 'new'),
  extra: SERIES.filter((s) => s.group === 'extra'),
};
