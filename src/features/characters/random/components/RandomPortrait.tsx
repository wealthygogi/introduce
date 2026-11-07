import { useState } from 'react';
import type { ProfileCharacter } from '../../../../data/profileCatalog';
import { getCharacterPortrait } from '../../../../data/characterPortraits';
import { useLang } from '../../../../contexts/LangContext';

type Props = {
  character: ProfileCharacter;
  size?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  decorative?: boolean;
};

/** Portrait card used by the draw stage, results, history, and export. */
export default function RandomPortrait({ character, size, className = '', loading = 'lazy', decorative = false }: Props) {
  const { lang } = useLang();
  const [failed, setFailed] = useState(false);
  const portrait = getCharacterPortrait(character);
  const src = failed ? null : portrait.src;
  return (
    <span
      className={`random-portrait${className ? ` ${className}` : ''}`}
      style={size ? { '--random-portrait-size': `${size}px` } as React.CSSProperties : undefined}
      data-portrait-kind={src ? 'face' : 'initial'}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : character[lang]}
      aria-hidden={decorative || undefined}
    >
      {src
        ? <img src={src} alt="" draggable={false} decoding="async" loading={loading} onError={() => setFailed(true)} />
        : <span aria-hidden="true">{character[lang].slice(0, 1)}</span>}
    </span>
  );
}
