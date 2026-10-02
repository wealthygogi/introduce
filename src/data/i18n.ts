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
  shareLink: string;
  linkCopied: string;
  linkCopyFailed: string;
  tweet: string;
  tweetText: string;
  tweetTags: string;
  tweetSaved: string;
  tweetNoImage: string;
  tweetOpen: string;
  cancel: string;
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
  tabEdit: string;
  tabPreview: string;
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
  conceptP: string;
  conceptPDesc: string;
  conceptQ: string;
  conceptQDesc: string;
  conceptR: string;
  conceptRDesc: string;
  conceptS: string;
  conceptSDesc: string;
  conceptT: string;
  conceptTDesc: string;
  conceptU: string;
  conceptUDesc: string;
  conceptV: string;
  conceptVDesc: string;
  conceptW: string;
  conceptWDesc: string;
  conceptX: string;
  conceptXDesc: string;
  conceptY: string;
  conceptYDesc: string;
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
    shareLink: '링크 복사',
    linkCopied: '링크 복사됨!',
    linkCopyFailed: '복사 실패',
    tweet: '트윗하기',
    tweetText: '제 동방 트친소 카드예요! 🎴',
    tweetTags: '#동방_𝕏친소 #동방_트친소',
    tweetSaved: '이미지 저장됨 ✓',
    tweetNoImage: '트윗에는 이미지가 자동으로 첨부되지 않아요. 먼저 이미지를 저장한 뒤, 열리는 트윗 작성창에 첨부해 주세요.',
    tweetOpen: '트윗 작성창 열기',
    cancel: '취소',
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
    tabEdit: '입력',
    tabPreview: '미리보기',
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
    conceptP: '스펠카드 포토카드',
    conceptPDesc: '탄막 스펠카드처럼 선언하는 세로형 포토카드입니다.',
    conceptQ: '하쿠레이 오후다',
    conceptQDesc: '하쿠레이 신사의 부적처럼 소개합니다.',
    conceptR: '예대제 입장권',
    conceptRDesc: '예대제 입장 티켓처럼 좌석 번호와 함께 소개합니다.',
    conceptS: '홍마관 초대장',
    conceptSDesc: '홍마관 연회 초대장처럼 소개합니다.',
    conceptT: '겐소쿄 SNS 프로필',
    conceptTDesc: 'SNS 프로필 카드처럼 아이디와 함께 소개합니다.',
    conceptU: '메이드 폴라로이드',
    conceptUDesc: '사쿠야가 찍어 준 폴라로이드 사진처럼 소개합니다.',
    conceptV: 'PC-98 세이브 슬롯',
    conceptVDesc: '구작 세이브 화면처럼 레벨과 플레이 시간을 표시합니다.',
    conceptW: '영원정 전단',
    conceptWDesc: '영원정에서 뿌린 전단처럼 헤드라인으로 소개합니다.',
    conceptX: '비봉클럽 조사파일',
    conceptXDesc: '비봉클럽의 조사 기록 단말처럼 소개합니다.',
    conceptY: '스티커 다이어리',
    conceptYDesc: '스티커 가득한 다이어리 한 페이지처럼 소개합니다.',
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
    shareLink: 'リンクをコピー',
    linkCopied: 'コピーしました！',
    linkCopyFailed: 'コピー失敗',
    tweet: 'ツイート',
    tweetText: '私の東方・自己紹介カードです！🎴',
    tweetTags: '#東方好きな人と繋がりたい #東方Project',
    tweetSaved: '画像を保存しました ✓',
    tweetNoImage: 'ツイートに画像は自動で添付されません。先に画像を保存し、開いた作成画面に添付してください。',
    tweetOpen: 'ツイート作成画面を開く',
    cancel: 'キャンセル',
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
    tabEdit: '入力',
    tabPreview: 'プレビュー',
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
    conceptP: 'スペルカード・フォトカード',
    conceptPDesc: '弾幕スペルカードのように宣言する縦型フォトカードです。',
    conceptQ: '博麗の御札',
    conceptQDesc: '博麗神社の御札のように紹介します。',
    conceptR: '例大祭 入場券',
    conceptRDesc: '例大祭の入場券のように座席番号付きで紹介します。',
    conceptS: '紅魔館 招待状',
    conceptSDesc: '紅魔館の宴への招待状のように紹介します。',
    conceptT: '幻想郷SNSプロフィール',
    conceptTDesc: 'SNSのプロフィールカードのようにIDと一緒に紹介します。',
    conceptU: 'メイドのポラロイド',
    conceptUDesc: '咲夜が撮ってくれたポラロイド写真のように紹介します。',
    conceptV: 'PC-98 セーブスロット',
    conceptVDesc: '旧作のセーブ画面のようにレベルとプレイ時間を表示します。',
    conceptW: '永遠亭 瓦版',
    conceptWDesc: '永遠亭が配った瓦版のように見出しで紹介します。',
    conceptX: '秘封倶楽部 調査ファイル',
    conceptXDesc: '秘封倶楽部の調査記録端末のように紹介します。',
    conceptY: 'シールだいありー',
    conceptYDesc: 'シールいっぱいの日記の1ページのように紹介します。',
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
    shareLink: 'Copy link',
    linkCopied: 'Link copied!',
    linkCopyFailed: 'Copy failed',
    tweet: 'Tweet',
    tweetText: 'My Touhou intro card! 🎴',
    tweetTags: '#Touhou #TouhouProject',
    tweetSaved: 'Image saved ✓',
    tweetNoImage: 'The image is not attached to the tweet automatically. Save the image first, then attach it in the composer that opens.',
    tweetOpen: 'Open tweet composer',
    cancel: 'Cancel',
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
    tabEdit: 'Edit',
    tabPreview: 'Preview',
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
    conceptP: 'Spell Card Photocard',
    conceptPDesc: 'A portrait photocard declared like a danmaku spell card.',
    conceptQ: 'Hakurei Ofuda',
    conceptQDesc: 'Introduce yourself like a Hakurei Shrine talisman.',
    conceptR: 'Reitaisai Ticket',
    conceptRDesc: 'A Reitaisai admission ticket with your seat number.',
    conceptS: 'Scarlet Devil Mansion Invitation',
    conceptSDesc: 'An invitation to the Scarlet Devil Mansion.',
    conceptT: 'Gensokyo SNS Profile',
    conceptTDesc: 'An SNS profile card with your handle.',
    conceptU: 'Maid Polaroid',
    conceptUDesc: 'A polaroid snapped by the perfect maid.',
    conceptV: 'PC-98 Save Slot',
    conceptVDesc: 'A retro save screen with level and play time.',
    conceptW: 'Eientei Flyer',
    conceptWDesc: 'A flyer from Eientei with your name as the headline.',
    conceptX: 'Sealing Club Case File',
    conceptXDesc: 'A Sealing Club investigation record terminal.',
    conceptY: 'Sticker Diary',
    conceptYDesc: 'A diary page covered in stickers.',
  },
};
