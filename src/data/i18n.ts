export type Lang = 'ko' | 'ja' | 'en';

/** Localize a record that has ko/ja/en string fields. */
export function tr<T extends Record<Lang, string>>(item: T, lang: Lang): string {
  return item[lang];
}

export interface Messages {
  brand: string;
  heroTitle: string;
  heroSub: string;
  heroDesc: string;
  selectConcept: string;
  comingSoon: string;
  startCta: string;
  back: string;
  download: string;
  reroll: string;
  saving: string;
  saved: string;
  saveFailed: string;
  theme: string;
  language: string;
  // form
  nickname: string;
  callMe: string;
  bestChar: string;
  profileImage: string;
  uploadHint: string;
  uploadRemove: string;
  searchChar: string;
  collapse: string;
  expand: string;
  previewHide: string;
  previewShow: string;
  mainSeries: string;
  acctType: string;
  fub: string;
  parting: string;
  otherGenre: string;
  dislike: string;
  pairing: string;
  freeText: string;
  // groups
  oldWorks: string;
  newWorks: string;
  extraWorks: string;
  // radio choices
  free: string;
  r4r: string;
  unfollow: string;
  blockunfollow: string;
  block: string;
  none: string;
  sometimes: string;
  often: string;
  // placeholders
  phNick: string;
  nickFallback: string;
  phCall: string;
  phDis: string;
  phPair: string;
  phFree: string;
  // theme labels
  themeLight: string;
  themeDark: string;
  themeSpring: string;
  themeSummer: string;
  themeAutumn: string;
  themeWinter: string;
  // misc
  notSelected: string;
  expandHint: string;
  selectAll: string;
  cardLabel: string;
  intro: string;
  // concept names
  conceptA: string;
  conceptADesc: string;
  conceptB: string;
  conceptBDesc: string;
  conceptC: string;
  conceptCDesc: string;
  conceptD: string;
  conceptDDesc: string;
  conceptE: string;
  conceptEDesc: string;
  conceptF: string;
  conceptFDesc: string;
  conceptG: string;
  conceptGDesc: string;
  conceptH: string;
  conceptHDesc: string;
  conceptI: string;
  conceptIDesc: string;
  conceptJ: string;
  conceptJDesc: string;
  conceptK: string;
  conceptKDesc: string;
  conceptL: string;
  conceptLDesc: string;
  conceptM: string;
  conceptMDesc: string;
  conceptN: string;
  conceptNDesc: string;
  conceptO: string;
  conceptODesc: string;
}

export const messages: Record<Lang, Messages> = {
  ko: {
    brand: '동방 트친소',
    heroTitle: '동방 트친소 메이커',
    heroSub: '동방프로젝트 트위터 친구 소개서',
    heroDesc: '닉네임과 최애를 입력하면 자기소개 카드가 자동으로 만들어집니다. 마음에 드는 컨셉을 골라보세요.',
    selectConcept: '컨셉 선택',
    comingSoon: '준비 중',
    startCta: '시작하기',
    back: '목록으로',
    download: '이미지로 저장',
    reroll: '다시 뽑기',
    saving: '저장 중...',
    saved: '저장됨',
    saveFailed: '저장 실패',
    theme: '테마',
    language: '언어',
    nickname: '닉네임',
    callMe: '호칭',
    bestChar: '최애 캐릭터',
    profileImage: '프로필 사진',
    uploadHint: '클릭해서 사진을 올리세요',
    uploadRemove: '사진 삭제',
    searchChar: '캐릭터 검색',
    collapse: '접기',
    expand: '펼치기',
    previewHide: '미리보기 접기',
    previewShow: '미리보기 펼치기',
    mainSeries: '주력 시리즈',
    acctType: '계정 유형',
    fub: 'FUB',
    parting: '이별은',
    otherGenre: '타장르 언급',
    dislike: '불호 / 지뢰',
    pairing: '커플링',
    freeText: '자유서술',
    oldWorks: '구작',
    newWorks: '신작',
    extraWorks: '기타',
    free: '자유(FREE)',
    r4r: '맞팔(R4R)',
    unfollow: '언팔',
    blockunfollow: '블언블',
    block: '블락',
    none: '없음',
    sometimes: '가끔',
    often: '많음',
    phNick: '닉네임을 입력하세요',
    nickFallback: '닉네임',
    phCall: '○○야 / ○○씨 등',
    phDis: '없음',
    phPair: '○○ × ○○',
    phFree: '하고 싶은 말을 자유롭게',
    themeLight: '라이트',
    themeDark: '다크',
    themeSpring: '봄',
    themeSummer: '여름',
    themeAutumn: '가을',
    themeWinter: '겨울',
    notSelected: '미선택',
    expandHint: '클릭하여 전체 선택/해제',
    selectAll: '전체',
    cardLabel: '트친소 카드',
    intro: '자기소개',
    conceptA: 'RPG 상태창',
    conceptADesc: 'RPG 게임의 캐릭터 상태창처럼 능력치 형식으로 소개합니다.',
    conceptB: '스펠 카드 선언',
    conceptBDesc: '탄막 게임의 스펠 카드 선언 연출로 강렬한 인상을 줍니다.',
    conceptC: '타이틀 화면',
    conceptCDesc: '동방 게임의 타이틀 화면처럼 빛나는 닉네임이 중심입니다.',
    conceptD: '대화창',
    conceptDDesc: '캐릭터가 직접 당신을 소개하는 스토리 대화창 연출입니다.',
    conceptE: '설정 화면',
    conceptEDesc: '게임 설정 메뉴처럼 각 항목을 선택지로 표시합니다.',
    conceptF: '분분마루 신문',
    conceptFDesc: '샤메이마루 아야의 특종 1면처럼 소개합니다.',
    conceptG: '하쿠레이 오미쿠지',
    conceptGDesc: '신사 제비뽑기 운세처럼 소개합니다.',
    conceptH: '영원정 처방전',
    conceptHDesc: '에이린의 약 처방전 형식으로 소개합니다.',
    conceptI: '코미케 서클',
    conceptIDesc: '동인 서클 명함처럼 소개합니다.',
    conceptJ: '레트로 PC-98',
    conceptJDesc: '구작 도트 화면 감성으로 소개합니다.',
    conceptK: '요괴 도감',
    conceptKDesc: '요괴 도감 카드처럼 등록합니다.',
    conceptL: '브와르 마도서',
    conceptLDesc: '마법 도서관의 마도서처럼 소개합니다.',
    conceptM: '연회 초대장',
    conceptMDesc: '환상향 연회 초대장처럼 소개합니다.',
    conceptN: '겐소쿄 메신저',
    conceptNDesc: '현대적 메신저 프로필 카드처럼 소개합니다.',
    conceptO: '트레이딩 카드',
    conceptODesc: '능력치와 기술이 있는 수집형 카드처럼 소개합니다.',
  },
  ja: {
    brand: '東方 自己紹介',
    heroTitle: '東方 自己紹介 メーカー',
    heroSub: '東方Project ツイッター友達紹介書',
    heroDesc: 'ニックネームと推しを入力すると自己紹介カードが自動生成されます。お好きなコンセプトを選んでください。',
    selectConcept: 'コンセプト選択',
    comingSoon: '準備中',
    startCta: 'はじめる',
    back: '一覧へ',
    download: '画像として保存',
    reroll: '引き直す',
    saving: '保存中...',
    saved: '保存しました',
    saveFailed: '保存失敗',
    theme: 'テーマ',
    language: '言語',
    nickname: 'ニックネーム',
    callMe: '呼び方',
    bestChar: '推しキャラ',
    profileImage: 'プロフィール画像',
    uploadHint: 'クリックして画像をアップロード',
    uploadRemove: '画像を削除',
    searchChar: 'キャラ検索',
    collapse: '閉じる',
    expand: '開く',
    previewHide: 'プレビューを閉じる',
    previewShow: 'プレビューを開く',
    mainSeries: '主力シリーズ',
    acctType: 'アカウントタイプ',
    fub: 'FUB',
    parting: '別れは',
    otherGenre: '他ジャンル言及',
    dislike: '地雷・苦手',
    pairing: 'カップリング',
    freeText: '自由記述',
    oldWorks: '旧作',
    newWorks: '新作',
    extraWorks: 'その他',
    free: 'フリー(FREE)',
    r4r: '相互(R4R)',
    unfollow: 'アンフォロー',
    blockunfollow: 'B解',
    block: 'ブロック',
    none: 'なし',
    sometimes: 'たまに',
    often: '多め',
    phNick: 'ニックネームを入力',
    nickFallback: 'ニックネーム',
    phCall: '〇〇さん / 〇〇ちゃん など',
    phDis: 'なし',
    phPair: '〇〇 × 〇〇',
    phFree: '自由に書いてください',
    themeLight: 'ライト',
    themeDark: 'ダーク',
    themeSpring: '春',
    themeSummer: '夏',
    themeAutumn: '秋',
    themeWinter: '冬',
    notSelected: '未選択',
    expandHint: 'クリックで全選択/解除',
    selectAll: '全て',
    cardLabel: '自己紹介カード',
    intro: '自己紹介',
    conceptA: 'RPGステータス',
    conceptADesc: 'RPGゲームのキャラクターステータス画面のように紹介します。',
    conceptB: 'スペルカード宣言',
    conceptBDesc: '弾幕ゲームのスペルカード宣言演出で強烈な印象を。',
    conceptC: 'タイトル画面',
    conceptCDesc: '東方ゲームのタイトル画面のように輝くニックネームが中心。',
    conceptD: '会話ウィンドウ',
    conceptDDesc: 'キャラクターが直接あなたを紹介するストーリー会話演出。',
    conceptE: '設定画面',
    conceptEDesc: 'ゲームの設定メニューのように各項目を選択肢で表示。',
    conceptF: '文々。新聞',
    conceptFDesc: '射命丸文のスクープ一面のように紹介します。',
    conceptG: '博麗神社 御神籤',
    conceptGDesc: '神社のおみくじのように運勢で紹介します。',
    conceptH: '永遠亭 処方箋',
    conceptHDesc: '永琳の処方箋の形式で紹介します。',
    conceptI: '同人サークル',
    conceptIDesc: 'コミケのサークルカードのように紹介します。',
    conceptJ: '旧作レトロ',
    conceptJDesc: '旧作のドット画面テイストで紹介します。',
    conceptK: '妖怪図鑑',
    conceptKDesc: '妖怪図鑑カードのように登録します。',
    conceptL: 'ヴワル魔法図書館',
    conceptLDesc: '魔法図書館の魔導書のように紹介します。',
    conceptM: '宴会 招待状',
    conceptMDesc: '幻想郷の宴会の招待状のように紹介します。',
    conceptN: '幻想郷メッセンジャー',
    conceptNDesc: '現代風メッセンジャーのプロフィールのように紹介します。',
    conceptO: 'トレーディングカード',
    conceptODesc: 'ステータスと技を持つ収集カードのように紹介します。',
  },
  en: {
    brand: 'Touhou Intro',
    heroTitle: 'Touhou Friend Intro Maker',
    heroSub: 'Touhou Project Twitter Friend Introduction',
    heroDesc: 'Enter your nickname and favorite character to auto-generate an intro card. Pick whichever concept feels right.',
    selectConcept: 'Select Concept',
    comingSoon: 'Coming Soon',
    startCta: 'Start',
    back: 'Back',
    download: 'Save as Image',
    reroll: 'Reroll',
    saving: 'Saving...',
    saved: 'Saved',
    saveFailed: 'Save failed',
    theme: 'Theme',
    language: 'Language',
    nickname: 'Nickname',
    callMe: 'What to call me',
    bestChar: 'Favorite Character',
    profileImage: 'Profile Image',
    uploadHint: 'Click to upload an image',
    uploadRemove: 'Remove image',
    searchChar: 'Search character',
    collapse: 'Collapse',
    expand: 'Expand',
    previewHide: 'Hide preview',
    previewShow: 'Show preview',
    mainSeries: 'Main Series',
    acctType: 'Account Type',
    fub: 'FUB',
    parting: 'Parting',
    otherGenre: 'Other Genres',
    dislike: 'Dislikes / Triggers',
    pairing: 'Pairings',
    freeText: 'Free Notes',
    oldWorks: 'Old Works',
    newWorks: 'New Works',
    extraWorks: 'Extra',
    free: 'Free',
    r4r: 'R4R (mutual)',
    unfollow: 'Unfollow',
    blockunfollow: 'Block+Unblock',
    block: 'Block',
    none: 'None',
    sometimes: 'Sometimes',
    often: 'Often',
    phNick: 'Enter nickname',
    nickFallback: 'Nickname',
    phCall: 'Anything is fine',
    phDis: 'None',
    phPair: 'CharA × CharB',
    phFree: 'Write freely',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSpring: 'Spring',
    themeSummer: 'Summer',
    themeAutumn: 'Autumn',
    themeWinter: 'Winter',
    notSelected: 'None',
    expandHint: 'Click to toggle all',
    selectAll: 'All',
    cardLabel: 'Intro Card',
    intro: 'Self-Intro',
    conceptA: 'RPG Status',
    conceptADesc: 'Display your intro as character stats from an RPG game.',
    conceptB: 'Spell Card',
    conceptBDesc: 'Spell card declaration style from bullet hell games. Bold and dramatic.',
    conceptC: 'Title Screen',
    conceptCDesc: 'A Touhou title screen with your nickname glowing as the main title.',
    conceptD: 'Dialogue',
    conceptDDesc: 'A character introduces you directly, story dialogue style.',
    conceptE: 'Config Menu',
    conceptEDesc: 'Game settings menu layout where each item is a selectable option.',
    conceptF: 'Bunbunmaru News',
    conceptFDesc: 'A front-page scoop, Aya Shameimaru style.',
    conceptG: 'Shrine Fortune',
    conceptGDesc: 'An omikuji fortune slip drawn at the shrine.',
    conceptH: 'Eientei Prescription',
    conceptHDesc: 'A clinical prescription from Eirin.',
    conceptI: 'Doujin Circle',
    conceptIDesc: 'A Comiket circle card.',
    conceptJ: 'Retro PC-98',
    conceptJDesc: 'Retro dot-matrix vibes from the PC-98 era.',
    conceptK: 'Youkai Encyclopedia',
    conceptKDesc: 'Registered like a youkai encyclopedia entry.',
    conceptL: 'Voile Grimoire',
    conceptLDesc: 'A tome from the Voile magic library.',
    conceptM: 'Banquet Invitation',
    conceptMDesc: 'A Gensokyo banquet invitation.',
    conceptN: 'Gensokyo Messenger',
    conceptNDesc: 'A modern messenger profile card.',
    conceptO: 'Trading Card',
    conceptODesc: 'A collectible TCG card with stats and moves.',
  },
};
