import { defaultState, useFormState, type FubChoice, type OtherGenreChoice, type PartingChoice } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { SERIES } from '../data/series';
import { tr } from '../data/i18n';
import { WIDE_FIELD_RECOMMENDED_LENGTHS } from '../data/wideFields';
import AccountTypePicker from './AccountTypePicker';
import FavoriteWorkPicker from './FavoriteWorkPicker';
import PhotoUpload from './PhotoUpload';
import RadioGroup from './RadioGroup';
import RankedCharacterPicker from './RankedCharacterPicker';
import SocialAccountField from './SocialAccountField';

const fieldCopy = {
  'wide:handle': { ko: '아이디', ja: 'ID', en: 'Handle' },
  'wide:intro': { ko: '짧은 자기소개', ja: 'ひとこと自己紹介', en: 'Introduction' },
  'wide:keywords': { ko: '계정 키워드', ja: 'アカウントのキーワード', en: 'Account keywords' },
  'wide:callname': { ko: '호칭', ja: '呼び方', en: 'Call me' },
  'wide:age': { ko: '연령대', ja: '年齢', en: 'Age' },
  'wide:workNote': { ko: '좋아하는 작품 / 이유', ja: '好きな作品・理由', en: 'Favorite works / why' },
  'wide:characterNote': { ko: '캐릭터 취향 메모', ja: 'キャラクターの好み', en: 'Character notes' },
  'wide:activities': { ko: '주로 하는 활동', ja: '主な活動', en: 'Activities' },
  'wide:otherGenre': { ko: '타장르 상세', ja: '他ジャンル詳細', en: 'Other genres' },
  'wide:interaction': { ko: '교류 스타일', ja: '交流スタイル', en: 'Interaction' },
  'wide:boundaryMethod': { ko: '불호 대처 방식', ja: '苦手なものへの対応', en: 'Boundary method' },
  'wide:closing': { ko: '마지막 한마디', ja: '最後に', en: 'Closing' },
  'wide:pairing': { ko: '커플링', ja: 'カップリング', en: 'Pairings' },
  'wide:dislike': { ko: '불호·주의 사항', ja: '苦手なもの・注意事項', en: 'Dislikes / content notes' },
  'wide:freeText': { ko: '기타 소개', ja: 'その他の紹介', en: 'Additional information' },
} as const;

type WideFieldKey = keyof typeof fieldCopy;
type FieldConfig = { key: WideFieldKey; multiline?: boolean; max: number; hint?: Record<'ko' | 'ja' | 'en', string> };
const fieldConfigs: FieldConfig[] = [
  { key: 'wide:handle', max: 400 }, { key: 'wide:intro', max: 400, multiline: true },
  { key: 'wide:keywords', max: 400 }, { key: 'wide:callname', max: 400 }, { key: 'wide:age', max: 400 },
  { key: 'wide:workNote', max: 400, multiline: true, hint: { ko: '대표곡·입덕 계기·좋아하는 부분을 적어 보세요.', ja: '代表曲・好きになったきっかけ・好きなところを書けます。', en: 'Mention a signature song, what drew you in, or what you love about it.' } },
  { key: 'wide:characterNote', max: 400, multiline: true }, { key: 'wide:activities', max: 400 },
  { key: 'wide:otherGenre', max: 400 }, { key: 'wide:interaction', max: 400, multiline: true },
  { key: 'wide:boundaryMethod', max: 400 }, { key: 'wide:closing', max: 400, hint: { ko: '마지막 한마디는 짧은 인사로 사용합니다.', ja: '最後の一言には短い挨拶を書けます。', en: 'Use Closing for a brief greeting.' } },
  { key: 'wide:pairing', max: 100 }, { key: 'wide:dislike', max: 100 },
  { key: 'wide:freeText', max: 300, multiline: true, hint: { ko: '기타 소개를 적어 주세요. 마지막 한마디는 짧은 인사에 사용합니다.', ja: 'その他の紹介に使えます。最後の一言は短い挨拶用です。', en: 'Use this for extra profile details; Closing is for a brief greeting.' } },
];

const copy = {
  ko: {
    intro: '기본 소개', works: '좋아하는 작품', characters: '캐릭터·커플링', interaction: '교류 안내',
    introHelp: '전부 채우지 않아도 됩니다. 비어 있는 구역은 이미지에서 생략됩니다.',
    chosen: '선택', set: '작성됨', empty: '미작성', nickname: '닉네임', photo: '사진', review: '이전 선택 중 일부는 상한이나 분류 차이로 자동 이전하지 못했습니다. 원본을 참고해 대표 작품과 순위를 확인해 주세요.',
    original: '이전 선택 원본 보기', oldSeries: '기존 시리즈: ', oldCharacters: '기존 캐릭터 선택', oldWorks: '기존 작품 선택', dismiss: '확인', over: '권장 분량 초과',
  },
  ja: {
    intro: '基本プロフィール', works: '好きな作品', characters: 'キャラクター・カップリング', interaction: '交流について',
    introHelp: 'すべて入力する必要はありません。空のセクションは画像に表示されません。',
    chosen: '選択', set: '入力あり', empty: '未入力', nickname: 'ニックネーム', photo: '写真', review: '上限や分類の違いで移行できなかった選択があります。元の内容を参考に作品と順位を確認してください。',
    original: '以前の選択を表示', oldSeries: '以前のシリーズ: ', oldCharacters: '以前のキャラクター選択', oldWorks: '以前の作品選択', dismiss: '確認', over: '推奨文字数を超えています',
  },
  en: {
    intro: 'Basic profile', works: 'Favorite works', characters: 'Characters & pairings', interaction: 'Interaction notes',
    introHelp: 'You do not need to fill in every section. Empty sections are omitted from the image.',
    chosen: 'selected', set: 'has content', empty: 'empty', nickname: 'Nickname', photo: 'Photo', review: 'Some previous choices could not be migrated because of limits or category differences. Review the original choices and select your favorites.',
    original: 'View original selections', oldSeries: 'Previous series: ', oldCharacters: 'Previous character selections', oldWorks: 'Previous work selections', dismiss: 'Dismiss', over: 'Recommended length exceeded',
  },
};

function WideTextField({ config }: { config: FieldConfig }) {
  const { state, setCustom } = useFormState();
  const { lang } = useLang();
  const value = state.custom[config.key] ?? '';
  const recommended = WIDE_FIELD_RECOMMENDED_LENGTHS[config.key];
  const label = fieldCopy[config.key][lang];
  const countId = `${config.key.replace(':', '-')}-count`;
  const hintId = `${config.key.replace(':', '-')}-hint`;
  const over = [...value].length > recommended;
  return <div className="wide-form-field">
    <label className="form-label" htmlFor={config.key}>{label}</label>
    {config.hint && <p className="form-hint" id={hintId}>{config.hint[lang]}</p>}
    {config.multiline
      ? <textarea id={config.key} className="form-textarea" maxLength={config.max} value={value} aria-describedby={`${config.hint ? `${hintId} ` : ''}${countId}`} onChange={event => setCustom(config.key, event.target.value)} />
      : <input id={config.key} className="form-input" maxLength={config.max} value={value} aria-describedby={countId} onChange={event => setCustom(config.key, event.target.value)} />}
    <div className={`wide-form-count${over ? ' is-over' : ''}`} id={countId} aria-live="polite">{[...value].length}/{recommended}{over ? ` · ${copy[lang].over}` : ''}</div>
  </div>;
}

export default function WideFormPanel() {
  const { state, set, setCustom } = useFormState();
  const { lang, t } = useLang();
  const m = copy[lang];
  const field = (key: WideFieldKey) => <WideTextField key={key} config={fieldConfigs.find(item => item.key === key)!} />;
  const hasLegacy = state.custom['wide:selectionReview'] === '1' || !!state.custom['wide:characters'] || !!state.custom['wide:otherWorks'];
  const basicFilled = [state.nickname, state.profileImage, state.custom['wide:handle'], state.custom['wide:intro'], state.custom['wide:keywords'], state.custom['wide:callname'], state.custom['wide:age'], state.socialAccount].filter(value => typeof value === 'string' ? value.trim() : value).length + (state.selectedAcct.size ? 1 : 0);
  return <section className="wide-form-panel" aria-label={m.intro}>
    <p className="wide-form-intro">{m.introHelp}</p>
    <details className="wide-form-group" open>
      <summary><span>{m.intro}</span><small>{m.set}: {basicFilled}</small></summary>
      <div className="wide-form-group-body">
        <div className="form-section"><label className="form-label" htmlFor="wide-nickname">{t.nickname}</label><input id="wide-nickname" className="form-input" value={state.nickname} maxLength={10} aria-describedby="wide-nickname-count" onChange={event => set('nickname', event.target.value.slice(0, 10))} placeholder={t.phNick} /><div className="wide-form-count" id="wide-nickname-count" aria-live="polite">{[...state.nickname].length}/10</div></div>
        <PhotoUpload />{field('wide:handle')}{field('wide:intro')}{field('wide:keywords')}{field('wide:callname')}{field('wide:age')}
        <SocialAccountField /><AccountTypePicker />
        <RadioGroup<FubChoice> label={t.fub} value={state.fub} onChange={value => set('fub', value)} options={[{ value: 'free', label: t.free }, { value: 'r4r', label: t.r4r }]} />
        <RadioGroup<PartingChoice> label={t.parting} value={state.parting} onChange={value => set('parting', value)} options={[{ value: 'unfollow', label: t.unfollow }, { value: 'blockunfollow', label: t.blockunfollow }, { value: 'block', label: t.block }]} />
      </div>
    </details>
    <details className="wide-form-group">
      <summary><span>{m.works}</span><small>{state.favoriteWorks.length} {m.chosen}{state.custom['wide:workNote']?.trim() ? ` · ${m.set}` : ''}</small></summary>
      <div className="wide-form-group-body"><FavoriteWorkPicker />{field('wide:workNote')}</div>
    </details>
    <details className="wide-form-group">
      <summary><span>{m.characters}</span><small>{state.rankedCharacters.length} {m.chosen}{state.custom['wide:pairing']?.trim() || state.custom['wide:characterNote']?.trim() ? ` · ${m.set}` : ''}</small></summary>
      <div className="wide-form-group-body"><RankedCharacterPicker />{field('wide:pairing')}{field('wide:characterNote')}</div>
    </details>
    <details className="wide-form-group">
      <summary><span>{m.interaction}</span><small>{state.otherGenre !== defaultState.otherGenre || [state.custom['wide:activities'], state.custom['wide:otherGenre'], state.custom['wide:dislike'], state.custom['wide:boundaryMethod'], state.custom['wide:interaction'], state.custom['wide:closing'], state.custom['wide:freeText']].some(value => value?.trim()) ? m.set : m.empty}</small></summary>
      <div className="wide-form-group-body">
        <RadioGroup<OtherGenreChoice> label={t.otherGenre} value={state.otherGenre} onChange={value => set('otherGenre', value)} options={[{ value: 'none', label: t.none }, { value: 'sometimes', label: t.sometimes }, { value: 'often', label: t.often }]} />
        {field('wide:activities')}{field('wide:otherGenre')}{field('wide:dislike')}{field('wide:boundaryMethod')}{field('wide:interaction')}{field('wide:closing')}{field('wide:freeText')}
      </div>
    </details>
    {state.custom['wide:selectionReview'] === '1' && <div className="wide-review-hint" role="status"><p>{m.review}</p><button type="button" onClick={() => setCustom('wide:selectionReview', '')}>{m.dismiss}</button></div>}
    {hasLegacy && <details className="wide-migration-notes"><summary>{m.original}</summary><p>{m.oldSeries}{[...state.selectedSeries].map(id => { const series = SERIES.find(item => item.id === id); return series ? tr(series, lang) : id; }).join(' · ')}</p>{state.custom['wide:characters'] && <p><strong>{m.oldCharacters}: </strong>{state.custom['wide:characters']}</p>}{state.custom['wide:otherWorks'] && <p><strong>{m.oldWorks}: </strong>{state.custom['wide:otherWorks']}</p>}</details>}
  </section>;
}
