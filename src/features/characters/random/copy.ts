import type { Lang } from '../../../data/i18n';
import type { RoleFilter } from '../characterCategories';
import type { DrawCount, DrawMode, RandomScope } from './types';

export type RandomCopy = {
  eyebrow: string;
  heading: string;
  intro: string;
  draw: string;
  drawAgain: string;
  drawing: string;
  count: string;
  counts: Record<DrawCount, string>;
  filters: string;
  scope: string;
  scopes: Record<RandomScope, string>;
  works: string;
  searchWorks: string;
  selectAll: string;
  clearAll: string;
  roles: string;
  roleLabels: Record<RoleFilter, string>;
  stage: string;
  allStages: string;
  stageLabels: Record<'final' | 'extra' | 'phantasm', string>;
  stageNumber: (stage: number) => string;
  mode: string;
  modes: Record<DrawMode, string>;
  modeHint: string;
  personalization: string;
  personalizationHint: string;
  preferenceCount: (favorite: number, interested: number, avoid: number) => string;
  excludeRecent: string;
  pool: (count: number) => string;
  resetFilters: string;
  close: string;
  idleTitle: string;
  idleHint: string;
  result: string;
  resultCount: (count: number) => string;
  save: string;
  saving: string;
  saveReady: string;
  saveFailed: string;
  copyText: string;
  copied: string;
  copyFailed: string;
  pairAction: string;
  pairHint: string;
  history: string;
  historyEmpty: string;
  historyClear: string;
  historyCleared: string;
  undo: string;
  emptyTitle: string;
  emptyBody: string;
  emptyPreferenceTitle: string;
  emptyPreferenceBody: string;
  turnOffPreferences: string;
  relaxedRecent: string;
  clamped: (requested: number, actual: number) => string;
  storageWarning: string;
  restoreWarning: string;
  preferenceWarning: string;
  exportTitle: string;
  exportDate: (value: string) => string;
  exportFooter: string;
  resultAnnounce: (names: string) => string;
  filterDialog: string;
};

const copy: Record<Lang, RandomCopy> = {
  ko: {
    eyebrow: 'GENSOKYO · RANDOM DRAW',
    heading: '환상향 랜덤 뽑기',
    intro: '필터로 풀을 고르고, 오늘의 인연을 한 명 또는 여러 명 뽑아보세요.',
    draw: '뽑기',
    drawAgain: '다시 뽑기',
    drawing: '뽑는 중…',
    count: '인원',
    counts: { 1: '1인', 2: '커플 2인', 3: '3연', 5: '5연', 10: '10연' },
    filters: '뽑기 설정',
    scope: '작품 범위',
    scopes: { all: '전체', mainline: '정규작', pc98: '구작', spinoff: '외전', books: '서적' },
    works: '개별 작품',
    searchWorks: '작품 검색',
    selectAll: '전체 선택',
    clearAll: '전체 해제',
    roles: '역할',
    roleLabels: {
      playable: '플레이어', enemy: '적', boss: '보스', midboss: '중보스',
      opponent: '대전 상대', support: '지원·동료', other: '기타 역할',
    },
    stage: '스테이지',
    allStages: '모든 스테이지',
    stageLabels: { final: '최종면', extra: 'Extra', phantasm: 'Phantasm' },
    stageNumber: (stage: number) => `${stage}면`,
    mode: '분포',
    modes: { pool: '캐릭터 균등', balanced: '작품 균등' },
    modeHint: '작품 균등은 캐릭터의 대표 분류를 기준으로 맞춥니다.',
    personalization: '내 취향 반영',
    personalizationHint: '이 브라우저에 저장된 취향표와 커플링 기록만 읽습니다.',
    preferenceCount: (favorite: number, interested: number, avoid: number) => `최애 ${favorite} · 관심 ${interested} · 제외 ${avoid}`,
    excludeRecent: '최근 뽑은 인물 제외',
    pool: (count: number) => `대상 ${count}명`,
    resetFilters: '필터 초기화',
    close: '닫기',
    idleTitle: '카드를 넘겨보세요',
    idleHint: '뽑기 버튼을 누르면 결과 카드가 열립니다.',
    result: '결과',
    resultCount: (count: number) => `${count}명`,
    save: '결과 저장',
    saving: '저장 중…',
    saveReady: '이미지가 준비됐습니다. 한 번 더 눌러 저장하세요.',
    saveFailed: '이미지를 저장하지 못했습니다.',
    copyText: '문구 복사',
    copied: '결과 문구를 복사했습니다.',
    copyFailed: '결과 문구를 복사하지 못했습니다.',
    pairAction: '커플 카드로',
    pairHint: '정해진 관계는 아니에요. 두 사람을 골라 카드로 이어가세요.',
    history: '최근 기록',
    historyEmpty: '아직 기록이 없습니다.',
    historyClear: '기록 지우기',
    historyCleared: '기록을 지웠습니다.',
    undo: '실행 취소',
    emptyTitle: '조건에 맞는 인물이 없습니다.',
    emptyBody: '작품이나 역할 필터를 줄여 보세요.',
    emptyPreferenceTitle: '취향 아님으로 제외된 인물이 있습니다.',
    emptyPreferenceBody: '개인화를 끄거나 필터를 바꿔 보세요.',
    turnOffPreferences: '개인화 끄기',
    relaxedRecent: '최근 뽑은 인물을 제외하면 풀이 부족해 일부를 다시 포함했습니다.',
    clamped: (requested: number, actual: number) => `대상이 ${actual}명뿐이라 ${requested}명 대신 ${actual}명을 뽑았습니다.`,
    storageWarning: '이 브라우저에서는 기록을 저장할 수 없습니다. 현재 탭에서만 유지됩니다.',
    restoreWarning: '저장된 기록을 읽지 못해 새 설정으로 시작합니다.',
    preferenceWarning: '일부 취향 기록을 읽지 못했습니다.',
    exportTitle: '환상향 랜덤 뽑기',
    exportDate: (value: string) => `뽑은 날 · ${value}`,
    exportFooter: 'GENSOKYO · RANDOM DRAW',
    resultAnnounce: (names: string) => `결과: ${names}`,
    filterDialog: '뽑기 설정',
  },
  ja: {
    eyebrow: 'GENSOKYO · RANDOM DRAW',
    heading: '幻想郷ランダム抽選',
    intro: 'フィルターで候補を選び、今日の縁を一人または複数人で引いてみましょう。',
    draw: '引く',
    drawAgain: 'もう一度引く',
    drawing: '抽選中…',
    count: '人数',
    counts: { 1: '1人', 2: 'カップル2人', 3: '3連', 5: '5連', 10: '10連' },
    filters: '抽選設定',
    scope: '作品範囲',
    scopes: { all: 'すべて', mainline: '整数作品', pc98: '旧作', spinoff: '外伝', books: '書籍' },
    works: '個別作品',
    searchWorks: '作品を検索',
    selectAll: 'すべて選択',
    clearAll: 'すべて解除',
    roles: '役割',
    roleLabels: {
      playable: 'プレイヤー', enemy: '敵', boss: 'ボス', midboss: '中ボス',
      opponent: '対戦相手', support: '支援・仲間', other: 'その他の役割',
    },
    stage: 'ステージ',
    allStages: 'すべてのステージ',
    stageLabels: { final: '最終面', extra: 'Extra', phantasm: 'Phantasm' },
    stageNumber: (stage: number) => `${stage}面`,
    mode: '分布',
    modes: { pool: 'キャラクター均等', balanced: '作品均等' },
    modeHint: '作品均等はキャラクターの代表分類を基準にそろえます。',
    personalization: '自分の好みを反映',
    personalizationHint: 'このブラウザーに保存されたお気に入り表とカップリング記録だけを読みます。',
    preferenceCount: (favorite: number, interested: number, avoid: number) => `推し ${favorite} · 関心 ${interested} · 除外 ${avoid}`,
    excludeRecent: '最近引いた人物を除外',
    pool: (count: number) => `対象 ${count}人`,
    resetFilters: 'フィルター初期化',
    close: '閉じる',
    idleTitle: 'カードをめくってみましょう',
    idleHint: '「引く」を押すと結果カードが開きます。',
    result: '結果',
    resultCount: (count: number) => `${count}人`,
    save: '結果を保存',
    saving: '保存中…',
    saveReady: '画像の準備ができました。もう一度押して保存してください。',
    saveFailed: '画像を保存できませんでした。',
    copyText: '文面をコピー',
    copied: '結果の文面をコピーしました。',
    copyFailed: '結果の文面をコピーできませんでした。',
    pairAction: 'カップルカードへ',
    pairHint: '決まった関係ではありません。二人を選んでカードにつなげましょう。',
    history: '最近の記録',
    historyEmpty: 'まだ記録がありません。',
    historyClear: '記録を消す',
    historyCleared: '記録を消しました。',
    undo: '元に戻す',
    emptyTitle: '条件に合う人物がいません。',
    emptyBody: '作品や役割のフィルターを減らしてみてください。',
    emptyPreferenceTitle: '苦手として除外された人物がいます。',
    emptyPreferenceBody: '個人設定を切るか、フィルターを変えてください。',
    turnOffPreferences: '個人設定を切る',
    relaxedRecent: '最近引いた人物を除外すると候補が足りないため、一部を戻しました。',
    clamped: (requested: number, actual: number) => `対象が${actual}人しかいないため、${requested}人ではなく${actual}人を引きました。`,
    storageWarning: 'このブラウザーでは記録を保存できません。現在のタブでのみ保持します。',
    restoreWarning: '保存された記録を読めなかったため、新しい設定で始めます。',
    preferenceWarning: '一部の好みの記録を読めませんでした。',
    exportTitle: '幻想郷ランダム抽選',
    exportDate: (value: string) => `引いた日 · ${value}`,
    exportFooter: 'GENSOKYO · RANDOM DRAW',
    resultAnnounce: (names: string) => `結果: ${names}`,
    filterDialog: '抽選設定',
  },
  en: {
    eyebrow: 'GENSOKYO · RANDOM DRAW',
    heading: 'Gensokyo random draw',
    intro: 'Choose a pool with filters, then draw one character or a whole set.',
    draw: 'Draw',
    drawAgain: 'Draw again',
    drawing: 'Drawing…',
    count: 'Count',
    counts: { 1: '1', 2: 'Pair of 2', 3: '3', 5: '5', 10: '10' },
    filters: 'Draw settings',
    scope: 'Work scope',
    scopes: { all: 'All', mainline: 'Mainline', pc98: 'PC-98', spinoff: 'Spin-offs', books: 'Books' },
    works: 'Individual works',
    searchWorks: 'Search works',
    selectAll: 'Select all',
    clearAll: 'Clear all',
    roles: 'Roles',
    roleLabels: {
      playable: 'Playable', enemy: 'Enemy', boss: 'Boss', midboss: 'Midboss',
      opponent: 'Opponent', support: 'Support', other: 'Other role',
    },
    stage: 'Stage',
    allStages: 'All stages',
    stageLabels: { final: 'Final stage', extra: 'Extra', phantasm: 'Phantasm' },
    stageNumber: (stage: number) => `Stage ${stage}`,
    mode: 'Distribution',
    modes: { pool: 'Character equal', balanced: 'Work equal' },
    modeHint: 'Work equal balances by each character’s representative group.',
    personalization: 'Reflect my preferences',
    personalizationHint: 'Reads only the taste board and coupling records saved in this browser.',
    preferenceCount: (favorite: number, interested: number, avoid: number) => `Favorites ${favorite} · Interested ${interested} · Excluded ${avoid}`,
    excludeRecent: 'Exclude recent draws',
    pool: (count: number) => `${count} in pool`,
    resetFilters: 'Reset filters',
    close: 'Close',
    idleTitle: 'Turn over a card',
    idleHint: 'Press Draw to reveal your result.',
    result: 'Result',
    resultCount: (count: number) => `${count} characters`,
    save: 'Save result',
    saving: 'Saving…',
    saveReady: 'Your image is ready. Press again to save.',
    saveFailed: 'Could not save the image.',
    copyText: 'Copy text',
    copied: 'Copied the result text.',
    copyFailed: 'Could not copy the result text.',
    pairAction: 'Open pair card',
    pairHint: 'This is not a canon relationship. Carry the two into a pair card.',
    history: 'Recent draws',
    historyEmpty: 'No draws yet.',
    historyClear: 'Clear history',
    historyCleared: 'History cleared.',
    undo: 'Undo',
    emptyTitle: 'No characters match these filters.',
    emptyBody: 'Try fewer works or roles.',
    emptyPreferenceTitle: 'Every candidate was excluded by your preferences.',
    emptyPreferenceBody: 'Turn off personalization or change the filters.',
    turnOffPreferences: 'Turn off personalization',
    relaxedRecent: 'Recent draws were restored because excluding them left too few candidates.',
    clamped: (requested: number, actual: number) => `Only ${actual} candidates were available, so ${actual} were drawn instead of ${requested}.`,
    storageWarning: 'This browser cannot save history. It stays in this tab only.',
    restoreWarning: 'Saved history could not be read. Starting with fresh settings.',
    preferenceWarning: 'Some preference records could not be read.',
    exportTitle: 'Gensokyo random draw',
    exportDate: (value: string) => `Drawn on · ${value}`,
    exportFooter: 'GENSOKYO · RANDOM DRAW',
    resultAnnounce: (names: string) => `Result: ${names}`,
    filterDialog: 'Draw settings',
  },
};

export default copy;
