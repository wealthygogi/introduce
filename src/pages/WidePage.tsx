import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import DownloadButton from '../components/DownloadButton';
import WideFormPanel from '../components/WideFormPanel';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { WIDE_THEMES, type WideLayout, type WideThemeId } from '../data/wideThemes';
import { useDerived } from '../hooks/useDerived';
import WideCard from '../components/WideCard';
import '../styles/wide.css';
import '../styles/wide-form.css';

const layouts: Record<WideLayout, { width: number; height: number; label: string }> = {
  grid: { width: 1600, height: 1200, label: '2×2' },
  row: { width: 1920, height: 1080, label: '1×4' },
};
const validTheme = (id: string | undefined): id is WideThemeId => WIDE_THEMES.some((theme) => theme.id === id);

export default function WidePage() {
  const { theme: routeTheme } = useParams<{ theme: string }>();
  const [search, setSearch] = useSearchParams();
  const { lang } = useLang();
  const { state } = useFormState();
  const data = useDerived();
  const [actualSize, setActualSize] = useState(false);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(1200);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const layout: WideLayout = search.get('layout') === 'row' ? 'row' : 'grid';
  const themeId = routeTheme as WideThemeId;
  useEffect(() => {
    const node = wrapRef.current;
    const sheetNode = sheetRef.current;
    if (!node || !sheetNode) return;
    const update = () => { setAvailableWidth(node.clientWidth); setSheetHeight(sheetNode.offsetHeight); };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node); observer.observe(sheetNode);
    return () => observer.disconnect();
  }, [layout, themeId]);
  if (!validTheme(routeTheme)) return <Navigate to="/wide" replace />;
  const theme = WIDE_THEMES.find((item) => item.id === themeId)!;
  const sheet = layouts[layout];
  const scale = actualSize || !availableWidth ? 1 : Math.min(1, availableWidth / sheet.width);
  const localized: Record<string, Record<'ko' | 'ja' | 'en', string>> = {
    title: { ko: '나의 자기소개표', ja: 'プロフィールシート', en: 'My profile sheet' }, edit: { ko: '소개 편집', ja: 'プロフィールを編集', en: 'Edit profile' }, layout: { ko: '배치', ja: 'レイアウト', en: 'Layout' },
    grid: { ko: '2×2 · 2행 2열', ja: '2×2 · 2行2列', en: '2×2 · two rows' }, row: { ko: '1×4 · 1행 4열', ja: '1×4 · 1行4列', en: '1×4 · one row' }, fit: { ko: '화면에 맞춰 보기', ja: '画面に合わせる', en: 'Fit preview' },
    actual: { ko: '원본 크기로 보기', ja: '原寸で表示', en: 'View at actual size' }, back: { ko: 'Wide 갤러리', ja: 'Wide ギャラリー', en: 'Wide gallery' }, theme: { ko: '스타일', ja: 'スタイル', en: 'Style' },
    height: { ko: '입력량에 따라 높이가 달라집니다.', ja: '入力内容に応じて高さが変わります。', en: 'Height varies with the amount of content.' },
    tallRow: { ko: '내용이 많아 세로로 길어졌습니다. 2×2 배치도 확인해 보세요.', ja: '内容が多く縦長になっています。2×2レイアウトもご確認ください。', en: 'This content is tall. Consider checking the 2×2 layout.' },
  };
  const text = (key: string) => localized[key][lang];
  const changeLayout = (value: WideLayout) => setSearch(params => { params.set('layout', value); return params; });
  const scaledHeight = Math.ceil(sheetHeight * scale);
  return <div className="wide-page" data-wide-theme={themeId}><div className="wide-workspace"><aside className="wide-editor">
    <div className="wide-editor-heading"><div><span className="wide-kicker">WIDE · SINGLE SHEET</span><h1>{text('edit')}</h1></div><Link className="wide-back" to="/wide">← {text('back')}</Link></div>
    <WideFormPanel />
  </aside><section className="wide-preview" aria-label={text('title')}><div className="wide-toolbar"><div><span className="wide-kicker">{text('theme')}</span><h2>{theme.name[lang]}</h2></div><DownloadButton targetId="wide-export" filename={`trchinso-wide-${themeId}-${layout}.png`} captureOptions={{ scale: 2, padding: 48 }} /></div>
    <p className="wide-description">{theme.description[lang]}</p><div className="wide-theme-links">{WIDE_THEMES.map(option => <Link key={option.id} aria-current={option.id === themeId ? 'page' : undefined} to={`/wide/${option.id}?layout=${layout}`}>{option.name[lang]}</Link>)}</div>
    <div className="wide-layout-switch" role="group" aria-label={text('layout')}>{(['grid', 'row'] as WideLayout[]).map(item => <button key={item} type="button" data-wide-layout={item} aria-pressed={layout === item} onClick={() => changeLayout(item)}>{text(item)}</button>)}</div>
    <p className="wide-layout-note">{text('height')}</p>{layout === 'row' && sheetHeight > sheet.width && <p className="wide-layout-note" role="status">{text('tallRow')}</p>}
    <div className="wide-preview-controls"><span>{sheet.width} × {sheetHeight}px · {Math.round(scale * 100)}%</span><button type="button" aria-pressed={actualSize} onClick={() => setActualSize(value => !value)}>{actualSize ? text('fit') : text('actual')}</button></div>
    <div className={`wide-preview-window${actualSize ? ' is-actual' : ''}`} ref={wrapRef}><div className="wide-scale-frame" style={{ height: actualSize ? 'auto' : scaledHeight }}><div className="wide-scale" style={{ width: sheet.width, transform: actualSize ? 'none' : `scale(${scale})`, transformOrigin: 'top left' }}><article ref={sheetRef} id="wide-export" className={`wide-sheet wide-theme-${themeId}`} data-layout={layout} style={{ width: sheet.width }}><WideCard theme={themeId} layout={layout} state={state} data={data} lang={lang} /></article></div></div></div>
  </section></div></div>;
}
