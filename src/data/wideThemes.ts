import type { Lang } from './i18n';

export type WideThemeId = 'paper' | 'album' | 'terminal' | 'hifuu';
export type WideLayout = 'grid' | 'row';

export const WIDE_THEMES: { id: WideThemeId; name: Record<Lang, string>; description: Record<Lang, string> }[] = [
  { id: 'paper', name: { ko: '페이퍼 에디토리얼', ja: 'ペーパー・エディトリアル', en: 'Paper Editorial' }, description: { ko: '정돈된 여백과 보라색 포인트의 자기소개표', ja: '余白と紫のアクセントで整えるプロフィール', en: 'A clean profile with generous spacing and violet accents' } },
  { id: 'album', name: { ko: '환상향 스크랩북', ja: '幻想郷スクラップブック', en: 'Gensokyo Scrapbook' }, description: { ko: '사진과 메모를 붙여 꾸미는 따뜻한 취향 기록', ja: '写真とメモでつづる温かな趣味の記録', en: 'A warm collection of photos, notes, and favorites' } },
  { id: 'terminal', name: { ko: '환상향 터미널', ja: '幻想郷ターミナル', en: 'Gensokyo Terminal' }, description: { ko: '모노스페이스와 선명한 구획의 레트로 화면', ja: '等幅文字と明確な区画のレトロ画面', en: 'A retro display with monospace type and clear panels' } },
  { id: 'hifuu', name: { ko: '비봉구락부 관측 수첩', ja: '秘封倶楽部・観測手帖', en: 'Hifuu Observation Journal' }, description: { ko: '렌코와 메리의 밤하늘, 별자리와 경계를 기록하는 관측 수첩', ja: '蓮子とメリーの夜空、星座と境界を記す観測手帖', en: 'Renko and Merry’s journal of constellations and the boundary beyond' } },
];
