import type { ReactNode } from 'react';
import './photocard.css';
import { useLang } from '../../contexts/LangContext';

/**
 * 세로 포토카드(360×540) 공통 프레임.
 * id="preview-card" 는 Download/Tweet/E2E 가 찾는 계약이다.
 * data-lang 은 캡처 clone 이 html[lang] 조상을 잃어도 언어별 CSS 가 유지되게 한다
 * (포토카드 CSS 에서 :lang() 금지 — `.pc-frame[data-lang='ja']` 로만 분기).
 */
export default function PhotoCardShell({
  concept,
  children,
}: {
  concept: string;
  children: ReactNode;
}) {
  const { lang } = useLang();
  return (
    <div id="preview-card" className={`pc-frame pc-${concept}`} data-lang={lang}>
      {children}
    </div>
  );
}
