import { useState } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { getCouplingPortrait, type ProfileCharacter } from '../data';

type Props = { character: ProfileCharacter; size?: number; decorative?: boolean; className?: string; loading?: 'lazy' | 'eager' };
export default function CharacterAvatar({ character, size = 40, decorative = false, className = '', loading = 'lazy' }: Props) {
  const { lang } = useLang();
  const portrait = getCouplingPortrait(character);
  const [failed, setFailed] = useState(false);
  const src = failed ? null : portrait.src;
  const kind = src ? portrait.kind : 'initial';
  return <span
    className={`coupling-avatar coupling-avatar-${kind}${className ? ` ${className}` : ''}`}
    style={{ '--coupling-avatar-size': `${size}px` } as React.CSSProperties}
    data-portrait-kind={kind}
    aria-hidden={decorative || undefined}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : character[lang]}
  >{src ? <img src={src} alt="" draggable={false} decoding="async" loading={loading} onError={() => setFailed(true)} /> : <span>{character[lang].slice(0, 1)}</span>}</span>;
}
