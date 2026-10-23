import type { CSSProperties, ReactNode } from 'react';
import type { FormState } from '../contexts/FormStateContext';
import type { Derived } from '../hooks/useDerived';
import { tr, type Lang } from '../data/i18n';
import type { WideLayout, WideThemeId } from '../data/wideThemes';
import { ACCT_TYPES } from '../data/accountTypes';
import { PROFILE_CHARACTER_BY_ID, PROFILE_WORK_BY_ID } from '../data/profileCatalog';
import { spriteUrl } from '../data/characters';
import SocialQrFooter from './SocialQrFooter';

type PanelName = 'profile' | 'works' | 'characters' | 'interaction';

export default function WideCard({ theme, layout, state, data, lang }: { theme: WideThemeId; layout: WideLayout; state: FormState; data: Derived; lang: Lang }) {
  const custom = (key: string) => state.custom[`wide:${key}`]?.trim() ?? '';
  const part = (label: string, value: string) => value ? <div className="wide-detail"><b>{label}</b><span>{value}</span></div> : null;
  const labels = { ko: ['기본 소개', '좋아하는 작품', '캐릭터 · 커플링', '교류 안내'], ja: ['プロフィール', '好きな作品', 'キャラクター・カップリング', '交流について'], en: ['Profile', 'Favorite works', 'Characters & pairings', 'Interaction'] }[lang];
  const media = { game: { ko: '게임', ja: 'ゲーム', en: 'Game' }, book: { ko: '도서', ja: '書籍', en: 'Book' }, music: { ko: '음악', ja: '音楽', en: 'Music' } };
  const lead = state.rankedCharacters[0] ? PROFILE_CHARACTER_BY_ID.get(state.rankedCharacters[0]) : undefined;
  const avatar = state.profileImage ? { src: state.profileImage, alt: '', cls: '' } : lead?.spriteRel ? { src: spriteUrl(lead.spriteRel), alt: lead[lang], cls: 'wide-pixel-avatar' } : null;
  const accountCount = ACCT_TYPES.filter(item => state.selectedAcct.has(item.id)).length;
  const pairing = custom('pairing');
  const dislike = custom('dislike');
  const freeText = custom('freeText');
  const workNote = custom('workNote');
  const characterNote = custom('characterNote');
  const interactionValues = [custom('activities'), custom('otherGenre'), dislike, custom('boundaryMethod'), custom('interaction'), custom('closing'), freeText];
  const panels: { name: PanelName; content: ReactNode }[] = [
    { name: 'profile', content: <>
      <div className="wide-profile">{avatar ? <img className={avatar.cls || undefined} src={avatar.src} alt={avatar.alt} /> : <div className={`wide-neutral-avatar${lead ? ' has-character' : ''}`} aria-label={lead ? lead[lang] : (lang === 'ko' ? '선택한 캐릭터 없음' : lang === 'ja' ? 'キャラクター未選択' : 'No character selected')}>{lead ? [...lead[lang]][0] : (lang === 'ko' ? '프로필' : 'PROFILE')}</div>}<div><strong>{data.nickname}</strong>{part('ID', custom('handle'))}</div></div>
      {part('INTRO', custom('intro'))}{custom('keywords') && <div className="wide-chips">{custom('keywords').split(/[\n,]/).map(word => word.trim()).filter(Boolean).map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}</div>}{part(lang === 'ko' ? '호칭' : lang === 'ja' ? '呼び方' : 'Call me', custom('callname'))}{part(lang === 'ko' ? '연령' : lang === 'ja' ? '年齢' : 'Age', custom('age'))}{part('FUB', state.fub === 'free' ? data.t.free : data.t.r4r)}{part(data.t.parting, data.partingLabel)}<SocialQrFooter />
    </> },
    ...(state.favoriteWorks.length || workNote ? [{ name: 'works' as const, content: <>
      {state.favoriteWorks.length === 1 ? (() => { const id = state.favoriteWorks[0]; const work = PROFILE_WORK_BY_ID.get(id)!; return <div className="wide-single-work" data-favorite-work={id}><span>{work[lang]}</span><small>{media[work.category][lang]}</small></div>; })() : state.favoriteWorks.length > 1 ? <ul className="wide-favorite-works">{state.favoriteWorks.map(id => { const work = PROFILE_WORK_BY_ID.get(id)!; return <li key={id} data-favorite-work={id}><span>{work[lang]}</span><small>{media[work.category][lang]}</small></li>; })}</ul> : null}
      {part(lang === 'ko' ? '좋아하는 이유' : lang === 'ja' ? '好きな理由' : 'Why I love them', workNote)}
    </> }] : []),
    ...(state.rankedCharacters.length || pairing || characterNote ? [{ name: 'characters' as const, content: <>
      {state.rankedCharacters.map((id, index) => { const character = PROFILE_CHARACTER_BY_ID.get(id)!; return <div className={`wide-ranked-character${index === 0 ? ' is-primary' : ''}`} key={id} data-ranked-character={id} data-rank={index + 1}><b>{index + 1}</b>{character.spriteRel && <img src={spriteUrl(character.spriteRel)} alt="" /> }<span>{character[lang]}</span></div>; })}
      {part(data.t.pairing, pairing)}{part(lang === 'ko' ? '조합과 취향' : lang === 'ja' ? '好きな関係性' : 'Character notes', characterNote)}
    </> }] : []),
    ...(interactionValues.some(Boolean) ? [{ name: 'interaction' as const, content: <>
      {part(lang === 'ko' ? '활동' : lang === 'ja' ? '活動' : 'Activities', custom('activities'))}{part(lang === 'ko' ? '타장르 언급' : lang === 'ja' ? '他ジャンル' : 'Other genres', custom('otherGenre'))}{part(lang === 'ko' ? '불호 / 경계' : lang === 'ja' ? '苦手なもの' : 'Dislikes', dislike)}{part(lang === 'ko' ? '대처 방식' : lang === 'ja' ? '対応方法' : 'Boundary method', custom('boundaryMethod'))}{part(lang === 'ko' ? '교류 스타일' : lang === 'ja' ? '交流スタイル' : 'Interaction', custom('interaction'))}{part(lang === 'ko' ? '마지막 한마디' : lang === 'ja' ? '最後に' : 'Closing', custom('closing'))}{part(data.t.freeText, freeText)}
    </> }] : []),
  ];
  const gridColumns = Math.min(panels.length, layout === 'grid' ? 2 : 4);
  const frequencyLabel = { ko: '타장르 빈도', ja: '他ジャンルの頻度', en: 'Other-genre frequency' }[lang];
  return <>
    <header className="wide-masthead"><div><span className="wide-edition">{theme === 'hifuu' ? (lang === 'ko' ? '비봉구락부 · 경계 관측 기록' : lang === 'ja' ? '秘封倶楽部 · 境界観測記録' : 'HIFUU CLUB · BOUNDARY OBSERVATIONS') : 'TOUHOU PROJECT · FRIEND PROFILE'}</span><h2>{data.nickname}<small> {lang === 'ko' ? '자기소개표' : lang === 'ja' ? 'プロフィール' : 'Profile'}</small></h2></div>{theme === 'hifuu' ? <div className="wide-hifuu-emblem" aria-hidden="true"><svg width="300" height="126" viewBox="0 0 300 126" fill="none"><circle cx="150" cy="63" r="57" stroke="currentColor" opacity=".45"/><circle cx="150" cy="63" r="43" stroke="currentColor" opacity=".2"/><path d="M64 89 107 37 150 63 193 24 239 77M107 37 122 100 150 63 214 103M28 63H272M150 0V126" stroke="currentColor" opacity=".4"/><path d="M204 13a18 18 0 1 0 21 24 16 16 0 0 1-21-24Z" fill="currentColor" opacity=".85"/><g fill="currentColor"><circle cx="64" cy="89" r="3"/><circle cx="107" cy="37" r="4"/><circle cx="150" cy="63" r="3"/><circle cx="193" cy="24" r="3"/><circle cx="239" cy="77" r="4"/><circle cx="122" cy="100" r="2"/><circle cx="214" cy="103" r="2"/></g></svg><span>RENKO USAMI / MARIBEL HEARN</span></div> : <span className="wide-mark">{theme === 'terminal' ? '> HELLO_WORLD' : theme === 'album' ? '✦ MY GENSOKYO ✦' : 'Hello, Gensokyo.'}</span>}</header>
    {(accountCount > 0 || data.otherLabel) && <aside className="wide-account-strip">{accountCount > 0 && <div className="wide-check-block"><h4>{data.t.acctType}<small>{accountCount} / {ACCT_TYPES.length}</small></h4><ul className="wide-checklist wide-account-checklist" aria-label={data.t.acctType}>{ACCT_TYPES.map(item => { const chosen = state.selectedAcct.has(item.id); const label = tr(item, lang); return <li key={item.id} data-choice-id={item.id} data-selected={chosen} aria-label={`${label}: ${chosen ? (lang === 'ko' ? '선택됨' : lang === 'ja' ? '選択済み' : 'Selected') : (lang === 'ko' ? '미선택' : lang === 'ja' ? '未選択' : 'Not selected')}`} className={`wide-check-item${chosen ? ' is-selected' : ''}`}><span className="wide-check-marker" aria-hidden="true">{chosen ? '✓' : ''}</span><span className="wide-check-label">{label}</span></li>; })}</ul></div>}{data.otherLabel && <div className="wide-frequency"><b>{frequencyLabel}</b><span>{data.otherLabel}</span></div>}</aside>}
    <div className={`wide-grid wide-grid-${layout}`} style={{ '--wide-columns': gridColumns } as CSSProperties}>{panels.map((panel, index) => <section className={`wide-panel wide-panel-${panel.name}${panel.name === 'characters' && state.rankedCharacters.length === 1 ? ' wide-panel-single-character' : ''}`} data-wide-panel={panel.name} key={panel.name} style={layout === 'grid' && panels.length === 3 && index === 2 ? { gridColumn: '1 / -1' } : undefined}><h3><i>{String(index + 1).padStart(2, '0')}</i>{labels[['profile', 'works', 'characters', 'interaction'].indexOf(panel.name)]}</h3>{panel.content}</section>)}</div>
    <footer className="wide-sheet-footer"><span>{data.nickname}{custom('handle') ? ` · ${custom('handle')}` : ''}</span><span>{theme === 'hifuu' ? 'HIFUU CLUB · BETWEEN DREAM AND REALITY' : 'WIDE'} · {layout === 'grid' ? '2×2' : '1×4'} · SINGLE SHEET</span></footer>
  </>;
}
