import { useState } from 'react';
import { useLang } from '../../contexts/LangContext';
import './taste-board.css';

const copy = {
  ko: {
    heading: '어떻게 시작할까요?',
    hint: '원하는 방식으로 취향표를 만들어 보세요.',
    grid: '크기 선택해서 시작',
    gridHint: '표의 크기를 고르고 캐릭터를 자유롭게 채워 보세요.',
    presets: '표 크기',
    custom: '직접 선택',
    rows: '행',
    columns: '열',
    create: '표 만들기',
    alternative: '또는',
    works: '작품별 최애로 시작',
    worksHint: '작품별 칸을 만들고 각 작품의 최애를 골라 보세요.',
    cancel: '기존 표로 돌아가기',
  },
  ja: {
    heading: 'どのように始めますか？',
    hint: '好きな方法でお気に入り表を作りましょう。',
    grid: 'サイズを選んで始める',
    gridHint: '表のサイズを選び、キャラクターを自由に配置しましょう。',
    presets: '表のサイズ',
    custom: 'サイズを指定',
    rows: '行',
    columns: '列',
    create: '表を作成',
    alternative: 'または',
    works: '作品別の推しから始める',
    worksHint: '作品ごとのマスを作り、それぞれの推しを選びましょう。',
    cancel: '元の表に戻る',
  },
  en: {
    heading: 'How would you like to start?',
    hint: 'Choose how to create your taste board.',
    grid: 'Start by choosing a size',
    gridHint: 'Choose a grid size and fill it with characters freely.',
    presets: 'Board size',
    custom: 'Custom size',
    rows: 'Rows',
    columns: 'Columns',
    create: 'Create board',
    alternative: 'or',
    works: 'Start with favorites by work',
    worksHint: 'Create a slot for each work and choose your favorite for each.',
    cancel: 'Return to current board',
  },
} as const;

const presets = [[1, 3], [3, 3], [4, 4], [5, 5]] as const;
const sizes = Array.from({ length: 10 }, (_, index) => index + 1);

type Props = {
  onStartGrid: (rows: number, columns: number) => void;
  onStartByWorks: (opener: HTMLElement) => void;
  onCancel?: () => void;
};

export default function TasteStartScreen({ onStartGrid, onStartByWorks, onCancel }: Props) {
  const { lang } = useLang();
  const t = copy[lang];
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

  return <main className="taste-board-page">
    <header className="taste-board-header taste-start-header">
      <span className="taste-eyebrow">GENSOKYO · FAVORITES</span>
      <h1>{t.heading}</h1>
      <p>{t.hint}</p>
    </header>
    <div className="taste-start-options">
      <section className="taste-start-card" aria-labelledby="taste-start-grid-title">
        <h2 id="taste-start-grid-title">{t.grid}</h2>
        <p>{t.gridHint}</p>
        <div className="taste-control-block taste-start-presets" role="group" aria-label={t.presets}>
          {presets.map(([presetRows, presetColumns]) => <button
            key={`${presetRows}-${presetColumns}`}
            type="button"
            aria-pressed={rows === presetRows && columns === presetColumns}
            onClick={() => { setRows(presetRows); setColumns(presetColumns); }}
          >{presetRows} × {presetColumns}</button>)}
        </div>
        <details className="taste-start-custom">
          <summary>{t.custom}</summary>
          <div className="taste-start-custom-fields">
            <label className="taste-field">{t.rows}<select value={rows} onChange={event => setRows(Number(event.target.value))}>{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
            <label className="taste-field">{t.columns}<select value={columns} onChange={event => setColumns(Number(event.target.value))}>{sizes.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
          </div>
        </details>
        <button className="taste-start-primary" type="button" onClick={() => onStartGrid(rows, columns)}>{t.create}</button>
      </section>
      <div className="taste-start-divider" aria-hidden="true">{t.alternative}</div>
      <section className="taste-start-card" aria-labelledby="taste-start-works-title">
        <h2 id="taste-start-works-title">{t.works}</h2>
        <p>{t.worksHint}</p>
        <button className="taste-start-works" type="button" onClick={event => onStartByWorks(event.currentTarget)}>{t.works}</button>
      </section>
      {onCancel && <button className="taste-start-return" type="button" onClick={onCancel}>{t.cancel}</button>}
    </div>
  </main>;
}
