export type RevealOpening = 'seal' | 'sakura' | 'moon' | 'danmaku' | 'cards';
export type RevealMotion = 'flip' | 'fan' | 'doors' | 'cascade' | 'flare';
export type RevealFinish = 'petals' | 'stars' | 'ring' | 'spirits' | 'rays';

export type SeriesRevealTheme = {
  id: string;
  title: { ko: string; ja: string; en: string };
  motif: string;
};

export type RandomRevealPlan = {
  series: SeriesRevealTheme;
  opening: RevealOpening;
  motion: RevealMotion;
  finish: RevealFinish;
};

export const SERIES_REVEAL_THEMES: readonly SeriesRevealTheme[] = [
  { id: 'th6', title: { ko: '홍마향', ja: '紅魔郷', en: 'Embodiment of Scarlet Devil' }, motif: 'scarlet' },
  { id: 'th7', title: { ko: '요요몽', ja: '妖々夢', en: 'Perfect Cherry Blossom' }, motif: 'blossom' },
  { id: 'th8', title: { ko: '영야초', ja: '永夜抄', en: 'Imperishable Night' }, motif: 'moon' },
  { id: 'th9', title: { ko: '화영총', ja: '花映塚', en: 'Phantasmagoria of Flower View' }, motif: 'flower' },
  { id: 'th10', title: { ko: '풍신록', ja: '風神録', en: 'Mountain of Faith' }, motif: 'autumn' },
  { id: 'th11', title: { ko: '지령전', ja: '地霊殿', en: 'Subterranean Animism' }, motif: 'embers' },
  { id: 'th12', title: { ko: '성련선', ja: '星蓮船', en: 'Undefined Fantastic Object' }, motif: 'rainbow' },
  { id: 'th13', title: { ko: '신령묘', ja: '神霊廟', en: 'Ten Desires' }, motif: 'spirits' },
  { id: 'th14', title: { ko: '휘침성', ja: '輝針城', en: 'Double Dealing Character' }, motif: 'boundary' },
  { id: 'th15', title: { ko: '감주전', ja: '紺珠伝', en: 'Legacy of Lunatic Kingdom' }, motif: 'starlight' },
  { id: 'th16', title: { ko: '천공장', ja: '天空璋', en: 'Hidden Star in Four Seasons' }, motif: 'seasons' },
  { id: 'th17', title: { ko: '귀형수', ja: '鬼形獣', en: 'Wily Beast and Weakest Creature' }, motif: 'beasts' },
  { id: 'th18', title: { ko: '홍룡동', ja: '虹龍洞', en: 'Unconnected Marketeers' }, motif: 'market' },
  { id: 'th19', title: { ko: '수미상관', ja: '獣王園', en: 'Unfinished Dream of All Living Ghost' }, motif: 'dream' },
  { id: 'th20', title: { ko: '금상경', ja: '錦上京', en: 'Fossilized Wonders' }, motif: 'pyramid' },
];

export const REVEAL_OPENINGS: readonly RevealOpening[] = ['seal', 'sakura', 'moon', 'danmaku', 'cards'];
export const REVEAL_MOTIONS: readonly RevealMotion[] = ['flip', 'fan', 'doors', 'cascade', 'flare'];
export const REVEAL_FINISHES: readonly RevealFinish[] = ['petals', 'stars', 'ring', 'spirits', 'rays'];

function choose<T>(items: readonly T[], rng: () => number): T {
  const sample = Math.min(Math.max(rng(), 0), 1 - Number.EPSILON);
  return items[Math.floor(sample * items.length)];
}

/** Pick a series motif and three independent reveal layers for each draw. */
export function createRandomRevealPlan(rng: () => number = Math.random): RandomRevealPlan {
  return {
    series: choose(SERIES_REVEAL_THEMES, rng),
    opening: choose(REVEAL_OPENINGS, rng),
    motion: choose(REVEAL_MOTIONS, rng),
    finish: choose(REVEAL_FINISHES, rng),
  };
}
