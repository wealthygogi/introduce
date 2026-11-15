import { useLang } from '../contexts/LangContext';

export default function PageLoading() {
  const { lang } = useLang();
  return <p role="status">{{ ko: '불러오는 중…', ja: '読み込み中…', en: 'Loading…' }[lang]}</p>;
}
