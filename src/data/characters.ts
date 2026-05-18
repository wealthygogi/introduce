/**
 * Touhou character roster.
 * Sprite paths are relative to BASE_URL + 'Touhou 16x16 Mini Pack Full/'.
 * Korean names cross-referenced with touhouwiki-kr (https://github.com/wealthygogi/touhouwiki-kr).
 */

import type { Lang } from './i18n';

export type Character = {
  id: string;
  /** relative sprite path under the sprite pack root */
  rel: string;
} & Record<Lang, string>;

const M = '1. Mainline Games/';
const S = '2. Spin-offs/';
const G = '3. Manga/';
const O = '4. Other/';

export const CHARACTERS: Character[] = [
  // ── Main protagonists ──
  { id: 'reimu', rel: O + '[1] Main Characters/Reimu Hakurei.png', ko: '하쿠레이 레이무', ja: '博麗霊夢', en: 'Reimu Hakurei' },
  { id: 'marisa', rel: O + '[1] Main Characters/Marisa Kirisame.png', ko: '키리사메 마리사', ja: '霧雨魔理沙', en: 'Marisa Kirisame' },

  // ── TH06 Embodiment of Scarlet Devil ──
  { id: 'rumia', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Rumia.png', ko: '루미아', ja: 'ルーミア', en: 'Rumia' },
  { id: 'cirno', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Cirno.png', ko: '치르노', ja: 'チルノ', en: 'Cirno' },
  { id: 'daiyousei', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Daiyousei.png', ko: '대요정', ja: '大妖精', en: 'Daiyousei' },
  { id: 'meiling', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Hong Meiling.png', ko: '홍 메이링', ja: '紅美鈴', en: 'Hong Meiling' },
  { id: 'koakuma', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Koakuma.png', ko: '코아쿠마', ja: '小悪魔', en: 'Koakuma' },
  { id: 'patchouli', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Patchouli Knowledge.png', ko: '파츄리 널릿지', ja: 'パチュリー・ノーレッジ', en: 'Patchouli Knowledge' },
  { id: 'sakuya', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Sakuya Izayoi.png', ko: '이자요이 사쿠야', ja: '十六夜咲夜', en: 'Sakuya Izayoi' },
  { id: 'remilia', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png', ko: '레밀리아 스칼렛', ja: 'レミリア・スカーレット', en: 'Remilia Scarlet' },
  { id: 'flandre', rel: M + '[6] Koumakyou ~ Embodiment of Scarlet Devil/Flandre Scarlet.png', ko: '플랑드르 스칼렛', ja: 'フランドール・スカーレット', en: 'Flandre Scarlet' },

  // ── TH07 Perfect Cherry Blossom ──
  { id: 'letty', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Letty Whiterock.png', ko: '레티 화이트락', ja: 'レティ・ホワイトロック', en: 'Letty Whiterock' },
  { id: 'chen', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Chen.png', ko: '첸', ja: '橙', en: 'Chen' },
  { id: 'alice', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Alice Margatroid.png', ko: '앨리스 마가트로이드', ja: 'アリス・マーガトロイド', en: 'Alice Margatroid' },
  { id: 'lily', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Lily White.png', ko: '릴리 화이트', ja: 'リリーホワイト', en: 'Lily White' },
  { id: 'lunasa', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Lunasa Prismriver.png', ko: '루나사 프리즘리버', ja: 'ルナサ・プリズムリバー', en: 'Lunasa Prismriver' },
  { id: 'merlin', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Merlin Prismriver.png', ko: '메를랑 프리즘리버', ja: 'メルラン・プリズムリバー', en: 'Merlin Prismriver' },
  { id: 'lyrica', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Lyrica Prismriver.png', ko: '리리카 프리즘리버', ja: 'リリカ・プリズムリバー', en: 'Lyrica Prismriver' },
  { id: 'youmu', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Youmu Konpaku.png', ko: '콘파쿠 요우무', ja: '魂魄妖夢', en: 'Youmu Konpaku' },
  { id: 'yuyuko', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Yuyuko Saigyouji.png', ko: '사이교우지 유유코', ja: '西行寺幽々子', en: 'Yuyuko Saigyouji' },
  { id: 'ran', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Ran Yakumo.png', ko: '야쿠모 란', ja: '八雲藍', en: 'Ran Yakumo' },
  { id: 'yukari', rel: M + '[7] Youyoumu ~ Perfect Cherry Blossom/Yukari Yakumo.png', ko: '야쿠모 유카리', ja: '八雲紫', en: 'Yukari Yakumo' },

  // ── TH08 Imperishable Night ──
  { id: 'wriggle', rel: M + '[8] Eiyashou ~ Imperishable Night/Wriggle Nightbug.png', ko: '리글 나이트버그', ja: 'リグル・ナイトバグ', en: 'Wriggle Nightbug' },
  { id: 'mystia', rel: M + '[8] Eiyashou ~ Imperishable Night/Mystia Lorelei.png', ko: '미스티아 로렐라이', ja: 'ミスティア・ローレライ', en: 'Mystia Lorelei' },
  { id: 'keine', rel: M + '[8] Eiyashou ~ Imperishable Night/Keine Kamishirasawa.png', ko: '카미시라사와 케이네', ja: '上白沢慧音', en: 'Keine Kamishirasawa' },
  { id: 'tewi', rel: M + '[8] Eiyashou ~ Imperishable Night/Tewi Inaba.png', ko: '이나바 테위', ja: '因幡てゐ', en: 'Tewi Inaba' },
  { id: 'reisen', rel: M + '[8] Eiyashou ~ Imperishable Night/Reisen Udonge Inaba.png', ko: '레이센 우동게인 이나바', ja: '鈴仙・優曇華院・イナバ', en: 'Reisen Udongein Inaba' },
  { id: 'eirin', rel: M + '[8] Eiyashou ~ Imperishable Night/Eirin Yagokoro.png', ko: '야고코로 에이린', ja: '八意永琳', en: 'Eirin Yagokoro' },
  { id: 'kaguya', rel: M + '[8] Eiyashou ~ Imperishable Night/Kaguya Houraisan.png', ko: '호라이산 카구야', ja: '蓬莱山輝夜', en: 'Kaguya Houraisan' },
  { id: 'mokou', rel: M + '[8] Eiyashou ~ Imperishable Night/Fujiwara no Mokou.png', ko: '후지와라노 모코우', ja: '藤原妹紅', en: 'Fujiwara no Mokou' },

  // ── TH09 Phantasmagoria of Flower View ──
  { id: 'aya', rel: M + '[9] Kaeizuka ~ Phantasmagoria of Flower View/Aya Shameimaru.png', ko: '샤메이마루 아야', ja: '射命丸文', en: 'Aya Shameimaru' },
  { id: 'medicine', rel: M + '[9] Kaeizuka ~ Phantasmagoria of Flower View/Medicine Melancholy.png', ko: '메디슨 멜랑콜리', ja: 'メディスン・メランコリー', en: 'Medicine Melancholy' },
  { id: 'yuuka', rel: M + '[9] Kaeizuka ~ Phantasmagoria of Flower View/Yuuka Kazami.png', ko: '카자미 유카', ja: '風見幽香', en: 'Yuuka Kazami' },
  { id: 'komachi', rel: M + '[9] Kaeizuka ~ Phantasmagoria of Flower View/Komachi Onozuka.png', ko: '오노즈카 코마치', ja: '小野塚小町', en: 'Komachi Onozuka' },
  { id: 'shiki', rel: M + '[9] Kaeizuka ~ Phantasmagoria of Flower View/Eiki Shiki, Yamaxanadu.png', ko: '시키에이키 야마자나두', ja: '四季映姫・ヤマザナドゥ', en: 'Eiki Shiki, Yamaxanadu' },

  // ── TH10 Mountain of Faith ──
  { id: 'shizuha', rel: M + '[10] Fuujinroku ~ Mountain of faith/Shizuha Aki.png', ko: '아키 시즈하', ja: '秋静葉', en: 'Shizuha Aki' },
  { id: 'minoriko', rel: M + '[10] Fuujinroku ~ Mountain of faith/Minoriko Aki.png', ko: '아키 미노리코', ja: '秋穣子', en: 'Minoriko Aki' },
  { id: 'hina', rel: M + '[10] Fuujinroku ~ Mountain of faith/Hina Kagiyama.png', ko: '카기야마 히나', ja: '鍵山雛', en: 'Hina Kagiyama' },
  { id: 'nitori', rel: M + '[10] Fuujinroku ~ Mountain of faith/Nitori Kawashiro.png', ko: '카와시로 니토리', ja: '河城にとり', en: 'Nitori Kawashiro' },
  { id: 'momiji', rel: M + '[10] Fuujinroku ~ Mountain of faith/Momiji Inubashiri.png', ko: '이누바시리 모미지', ja: '犬走椛', en: 'Momiji Inubashiri' },
  { id: 'sanae', rel: M + '[10] Fuujinroku ~ Mountain of faith/Sanae Kochiya.png', ko: '코치야 사나에', ja: '東風谷早苗', en: 'Sanae Kochiya' },
  { id: 'kanako', rel: M + '[10] Fuujinroku ~ Mountain of faith/Kanako Yasaka.png', ko: '야사카 카나코', ja: '八坂神奈子', en: 'Kanako Yasaka' },
  { id: 'suwako', rel: M + '[10] Fuujinroku ~ Mountain of faith/Suwako Moriya.png', ko: '모리야 스와코', ja: '洩矢諏訪子', en: 'Suwako Moriya' },

  // ── TH11 Subterranean Animism ──
  { id: 'kisume', rel: M + '[11] Chireiden ~ Subterranean Animism/Kisume.png', ko: '키스메', ja: 'キスメ', en: 'Kisume' },
  { id: 'yamame', rel: M + '[11] Chireiden ~ Subterranean Animism/Yamame Kurodani.png', ko: '쿠로다니 야마메', ja: '黒谷ヤマメ', en: 'Yamame Kurodani' },
  { id: 'parsee', rel: M + '[11] Chireiden ~ Subterranean Animism/Parsee Mizuhashi.png', ko: '미즈하시 파르스이', ja: '水橋パルスィ', en: 'Parsee Mizuhashi' },
  { id: 'yuugi', rel: M + '[11] Chireiden ~ Subterranean Animism/Yuugi Hoshiguma.png', ko: '호시구마 유기', ja: '星熊勇儀', en: 'Yuugi Hoshiguma' },
  { id: 'satori', rel: M + '[11] Chireiden ~ Subterranean Animism/Satori Komeiji.png', ko: '코메이지 사토리', ja: '古明地さとり', en: 'Satori Komeiji' },
  { id: 'orin', rel: M + '[11] Chireiden ~ Subterranean Animism/Rin Kaenbyou.png', ko: '카엔뵤 린', ja: '火焔猫燐', en: 'Rin Kaenbyou' },
  { id: 'okuu', rel: M + '[11] Chireiden ~ Subterranean Animism/Utsuho Reiuji.png', ko: '레이우지 우츠호', ja: '霊烏路空', en: 'Utsuho Reiuji' },
  { id: 'koishi', rel: M + '[11] Chireiden ~ Subterranean Animism/Koishi Komeiji.png', ko: '코메이지 코이시', ja: '古明地こいし', en: 'Koishi Komeiji' },

  // ── TH12 Undefined Fantastic Object ──
  { id: 'nazrin', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Nazrin.png', ko: '나즈린', ja: 'ナズーリン', en: 'Nazrin' },
  { id: 'kogasa', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Kogasa Tatara.png', ko: '타타라 코가사', ja: '多々良小傘', en: 'Kogasa Tatara' },
  { id: 'ichirin', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Ichirin Kumoi.png', ko: '쿠모이 이치린', ja: '雲居一輪', en: 'Ichirin Kumoi' },
  { id: 'murasa', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Minamitsu Murasa.png', ko: '무라사 미나미츠', ja: '村紗水蜜', en: 'Minamitsu Murasa' },
  { id: 'shou', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Shou Toramaru.png', ko: '토라마루 쇼우', ja: '寅丸星', en: 'Shou Toramaru' },
  { id: 'byakuren', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Byakuren Hijiri.png', ko: '히지리 뱌쿠렌', ja: '聖白蓮', en: 'Byakuren Hijiri' },
  { id: 'nue', rel: M + '[12] Seirensen ~ Undefined Fantastic Object/Nue Houjuu.png', ko: '호쥬 누에', ja: '封獣ぬえ', en: 'Nue Houjuu' },

  // ── TH13 Ten Desires ──
  { id: 'kyouko', rel: M + '[13] Shinreibyou ~ Ten Desires/Kyouko Kasodani.png', ko: '카소다니 쿄코', ja: '幽谷響子', en: 'Kyouko Kasodani' },
  { id: 'yoshika', rel: M + '[13] Shinreibyou ~ Ten Desires/Yoshika Miyako.png', ko: '미야코 요시카', ja: '宮古芳香', en: 'Yoshika Miyako' },
  { id: 'seiga', rel: M + '[13] Shinreibyou ~ Ten Desires/Seiga Kaku.png', ko: '카쿠 세이가', ja: '霍青娥', en: 'Seiga Kaku' },
  { id: 'tojiko', rel: M + '[13] Shinreibyou ~ Ten Desires/Soga no Tojiko.png', ko: '소가노 토지코', ja: '蘇我屠自古', en: 'Soga no Tojiko' },
  { id: 'futo', rel: M + '[13] Shinreibyou ~ Ten Desires/Mononobe no Futo.png', ko: '모노노베노 후토', ja: '物部布都', en: 'Mononobe no Futo' },
  { id: 'miko', rel: M + '[13] Shinreibyou ~ Ten Desires/Toyosatomimi no Miko.png', ko: '토요사토미미노 미코', ja: '豊聡耳神子', en: 'Toyosatomimi no Miko' },
  { id: 'mamizou', rel: M + '[13] Shinreibyou ~ Ten Desires/Maimizou Futatsuiwa.png', ko: '후타츠이와 마미조', ja: '二ッ岩マミゾウ', en: 'Mamizou Futatsuiwa' },

  // ── TH14 Double Dealing Character ──
  { id: 'wakasagi', rel: M + '[14] Kishinjou ~ Double Dealing Character/Wakasagihime.png', ko: '와카사기히메', ja: 'わかさぎ姫', en: 'Wakasagihime' },
  { id: 'sekibanki', rel: M + '[14] Kishinjou ~ Double Dealing Character/Sekibanki.png', ko: '세키반키', ja: '赤蛮奇', en: 'Sekibanki' },
  { id: 'kagerou', rel: M + '[14] Kishinjou ~ Double Dealing Character/Kagerou Imaizumi.png', ko: '이마이즈미 카게로', ja: '今泉影狼', en: 'Kagerou Imaizumi' },
  { id: 'benben', rel: M + '[14] Kishinjou ~ Double Dealing Character/Benben Tsukumo.png', ko: '츠쿠모 벤벤', ja: '九十九弁々', en: 'Benben Tsukumo' },
  { id: 'yatsuhashi', rel: M + '[14] Kishinjou ~ Double Dealing Character/Yatsuhashi Tsukumo.png', ko: '츠쿠모 야츠하시', ja: '九十九八橋', en: 'Yatsuhashi Tsukumo' },
  { id: 'seija', rel: M + '[14] Kishinjou ~ Double Dealing Character/Seija Kijin.png', ko: '키진 세이자', ja: '鬼人正邪', en: 'Seija Kijin' },
  { id: 'shinmyoumaru', rel: M + '[14] Kishinjou ~ Double Dealing Character/Shinmyoumaru Sukuna.png', ko: '스쿠나 신묘마루', ja: '少名針妙丸', en: 'Shinmyoumaru Sukuna' },
  { id: 'raiko', rel: M + '[14] Kishinjou ~ Double Dealing Character/Raiko Horikawa.png', ko: '호리카와 라이코', ja: '堀川雷鼓', en: 'Raiko Horikawa' },

  // ── TH15 Legacy of Lunatic Kingdom ──
  { id: 'seiran', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Seiran.png', ko: '세이란', ja: '清蘭', en: 'Seiran' },
  { id: 'ringo', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Ringo.png', ko: '링고', ja: '鈴瑚', en: 'Ringo' },
  { id: 'doremy', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Doremy Sweet.png', ko: '도레미 스위트', ja: 'ドレミー・スイート', en: 'Doremy Sweet' },
  { id: 'sagume', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Sagume Kishin.png', ko: '키신 사구메', ja: '稀神サグメ', en: 'Sagume Kishin' },
  { id: 'clownpiece', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Clownpiece.png', ko: '클라운피스', ja: 'クラウンピース', en: 'Clownpiece' },
  { id: 'junko', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Junko.png', ko: '순호', ja: '純狐', en: 'Junko' },
  { id: 'hecatia', rel: M + '[15] Kanjuden ~ Legacy of Lunatic Kingdom/Hecatia Lapislazuli.png', ko: '헤카티아 라피스라줄리', ja: 'ヘカーティア・ラピスラズリ', en: 'Hecatia Lapislazuli' },

  // ── TH16 Hidden Star in Four Seasons ──
  { id: 'larva', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Eternity Larva.png', ko: '이터니티 라바', ja: 'エタニティラルバ', en: 'Eternity Larva' },
  { id: 'nemuno', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Nemuno Sakata.png', ko: '사카타 네무노', ja: '坂田ネムノ', en: 'Nemuno Sakata' },
  { id: 'aunn', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Aunn Komano.png', ko: '코마노 아운', ja: '高麗野あうん', en: 'Aunn Komano' },
  { id: 'narumi', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Narumi Yatadera.png', ko: '야타데라 나루미', ja: '矢田寺成美', en: 'Narumi Yatadera' },
  { id: 'satono', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Satono Nishida.png', ko: '니시다 사토노', ja: '爾子田里乃', en: 'Satono Nishida' },
  { id: 'mai', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Mai Teireida.png', ko: '테이레이다 마이', ja: '丁礼田舞', en: 'Mai Teireida' },
  { id: 'okina', rel: M + '[16] Tenkuushou ~ Hidden Star in Four Seasons/Okina Matara.png', ko: '마타라 오키나', ja: '摩多羅隠岐奈', en: 'Okina Matara' },

  // ── TH17 Wily Beast and Weakest Creature ──
  { id: 'eika', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Eika Ebisu.png', ko: '에비스 에이카', ja: 'えびす依花', en: 'Eika Ebisu' },
  { id: 'urumi', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Urumi Ushizaki.png', ko: '우시자키 우루미', ja: '牛崎潤美', en: 'Urumi Ushizaki' },
  { id: 'kutaka', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Kutaka Niwatari.png', ko: '니와타리 쿠타카', ja: '庭渡久侘歌', en: 'Kutaka Niwatari' },
  { id: 'yachie', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Yachie Kicchou.png', ko: '킷초 야치에', ja: '吉弔八千慧', en: 'Yachie Kicchou' },
  { id: 'mayumi', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Mayumi Joutouguu.png', ko: '조토구 마유미', ja: '杖刀偶磨弓', en: 'Mayumi Joutouguu' },
  { id: 'keiki', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Keiki Haniyasushin.png', ko: '하니야스신 케이키', ja: '埴安神袿姫', en: 'Keiki Haniyasushin' },
  { id: 'saki', rel: M + '[17] Kikeijuu ~ Wily Beast and Weakest Creature/Saki Kurokoma.png', ko: '쿠로코마 사키', ja: '驪駒早鬼', en: 'Saki Kurokoma' },

  // ── TH18 Unconnected Marketeers ──
  { id: 'mike', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Mike Goutokuji.png', ko: '고토쿠지 미케', ja: '豪徳寺ミケ', en: 'Mike Goutokuji' },
  { id: 'takane', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Takane Yamashiro.png', ko: '야마시로 타카네', ja: '山城たかね', en: 'Takane Yamashiro' },
  { id: 'sannyo', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Sannyo Komakusa.png', ko: '코마쿠사 산뇨', ja: '駒草山如', en: 'Sannyo Komakusa' },
  { id: 'misumaru', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Misumaru Tamatsukuri.png', ko: '타마츠쿠리 미스마루', ja: '玉造魅須丸', en: 'Misumaru Tamatsukuri' },
  { id: 'megumu', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Megumu Iizunamaru.png', ko: '이즈나마루 메구무', ja: '飯綱丸龍', en: 'Megumu Iizunamaru' },
  { id: 'tsukasa', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Tsukasa Kudamaki.png', ko: '쿠다마키 츠카사', ja: '菅牧典', en: 'Tsukasa Kudamaki' },
  { id: 'chimata', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Chimata Tenkyuu.png', ko: '텐큐 치마타', ja: '天弓千亦', en: 'Chimata Tenkyuu' },
  { id: 'momoyo', rel: M + '[18] Kouryuudou ~ Unconnected Marketeers/Momoyo Himemushi.png', ko: '히메무시 모모요', ja: '姫虫百々世', en: 'Momoyo Himemushi' },

  // ── TH19 Unfinished Dream of All Living Ghost ──
  { id: 'son_biten', rel: M + '[19] Juuouen ~ Unfinished Dream of All Living Ghost/Son Biten.png', ko: '손 비텐', ja: '孫美天', en: 'Son Biten' },
  { id: 'enoko', rel: M + '[19] Juuouen ~ Unfinished Dream of All Living Ghost/Enoko Mitsugashira.png', ko: '미츠가시라 에노코', ja: '三頭慧ノ子', en: 'Enoko Mitsugashira' },
  { id: 'chiyari', rel: M + '[19] Juuouen ~ Unfinished Dream of All Living Ghost/Chiyari Tenkajin.png', ko: '텐카진 치야리', ja: '天火人ちやり', en: 'Chiyari Tenkajin' },
  { id: 'hisami', rel: M + '[19] Juuouen ~ Unfinished Dream of All Living Ghost/Hisami Yomotsu.png', ko: '요모츠 히사미', ja: '豫母都比奈美', en: 'Hisami Yomotsu' },
  { id: 'zanmu', rel: M + '[19] Juuouen ~ Unfinished Dream of All Living Ghost/Zanmu Nippaku.png', ko: '닛파쿠 잔무', ja: '日白残無', en: 'Zanmu Nippaku' },

  // ── TH20 Fossilized Wonders ──
  { id: 'ubame', rel: M + '[20] Kinjoukyou ~ Fossilized Wonders/Ubame Chirizuka.png', ko: '치리즈카 우바메', ja: '塵塚姥目', en: 'Ubame Chirizuka' },
  { id: 'chimi', rel: M + '[20] Kinjoukyou ~ Fossilized Wonders/Chimi Houjuu.png', ko: '호쥬 치미', ja: '宝珠魑魅', en: 'Chimi Houjuu' },
  { id: 'nareko', rel: M + '[20] Kinjoukyou ~ Fossilized Wonders/Nareko Michigami.png', ko: '미치가미 나레코', ja: '道神成子', en: 'Nareko Michigami' },

  // ── Spin-offs ──
  { id: 'suika', rel: S + '[7.5] Suimusou ~ Immaterial and Missing Power/Suika Ibuki.png', ko: '이부키 스이카', ja: '伊吹萃香', en: 'Suika Ibuki' },
  { id: 'iku', rel: S + '[10.5] Hisouten ~ Scarlet Weather Rhapsody/Iku Nagae.png', ko: '나가에 이쿠', ja: '永江衣玖', en: 'Iku Nagae' },
  { id: 'tenshi', rel: S + '[10.5] Hisouten ~ Scarlet Weather Rhapsody/Tenshi Hinanawi.png', ko: '히나나위 텐시', ja: '比那名居天子', en: 'Tenshi Hinanawi' },
  { id: 'hatate', rel: S + '[12.5] Double Spoiler ~ Bunkachou/Hatate Himekaidou.png', ko: '히메카이도 하타테', ja: '姫海棠はたて', en: 'Hatate Himekaidou' },
  { id: 'kokoro', rel: S + '[13.5] Shinkirou ~ Hopeless Masquerade/Hata no Kokoro.png', ko: '하타노 코코로', ja: '秦こころ', en: 'Hata no Kokoro' },
  { id: 'sumireko', rel: S + '[14.5] Shinpiroku ~ Urban Legend in Limbo/Sumireko Usami.png', ko: '우사미 스미레코', ja: '宇佐見菫子', en: 'Sumireko Usami' },
  { id: 'joon', rel: S + '[15.5] Hyoubana ~ Antinomy of Common Flowers/Joon Yorigami.png', ko: '요리가미 조온', ja: '依神女苑', en: 'Joon Yorigami' },
  { id: 'shion', rel: S + '[15.5] Hyoubana ~ Antinomy of Common Flowers/Shion Yorigami.png', ko: '요리가미 시온', ja: '依神紫苑', en: 'Shion Yorigami' },
  { id: 'yuuma', rel: S + '[17.5] Gouyoku Ibun ~ Sunken Fossil World/Yuuma Toutetsu.png', ko: '토우테츠 유우마', ja: '饕餮尤魔', en: 'Yuuma Toutetsu' },

  // ── Manga / Print ──
  { id: 'kasen', rel: G + '[2] Ibarakasen ~ Wild and Horned Hermit/Kasen Ibaraki.png', ko: '이바라키 카센', ja: '茨木華扇', en: 'Kasen Ibaraki' },
  { id: 'akyuu', rel: G + '[3] Suzunaan ~ Forbidden Scrollery/Hieda no Akyuu.png', ko: '히에다노 아큐', ja: '稗田阿求', en: 'Hieda no Akyuu' },
  { id: 'kosuzu', rel: G + '[3] Suzunaan ~ Forbidden Scrollery/Kosuzu Motoori.png', ko: '모토오리 코스즈', ja: '本居小鈴', en: 'Kosuzu Motoori' },
  { id: 'yorihime', rel: G + '[1] Bougetsushou ~ Silent Sinner in Blue/Watatsuki no Yorihime.png', ko: '와타츠키노 요리히메', ja: '綿月依姫', en: 'Watatsuki no Yorihime' },
  { id: 'toyohime', rel: G + '[1] Bougetsushou ~ Silent Sinner in Blue/Watatsuki no Toyohime.png', ko: '와타츠키노 토요히메', ja: '綿月豊姫', en: 'Watatsuki no Toyohime' },

  // ── Other / Hifuu Club ──
  { id: 'renko', rel: O + '[2] Hifuu Club/Renko Usami.png', ko: '우사미 렌코', ja: '宇佐見蓮子', en: 'Renko Usami' },
  { id: 'maribel', rel: O + '[2] Hifuu Club/Maribel Hearn.png', ko: '마에리베리 한', ja: 'マエリベリー・ハーン', en: 'Maribel Hearn' },
];

export function spriteUrl(rel: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}Touhou 16x16 Mini Pack Full/${rel}`;
}

export function getCharacter(id: string): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
