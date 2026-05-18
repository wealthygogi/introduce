import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { CHARACTERS, getCharacter, spriteUrl } from '../data/characters';
import { SERIES } from '../data/series';
import { ACCT_TYPES } from '../data/accountTypes';
import { tr, type Messages, type Lang } from '../data/i18n';

export interface Derived {
  nickname: string;
  profileImage: string | null;
  charName: string;
  charSrc: string;
  /** primary avatar src — profileImage if set, else charSrc */
  avatarSrc: string;
  /** whether the avatar is a user-uploaded photo (true) or a pixel sprite (false) */
  avatarIsPhoto: boolean;
  seriesList: { id: string; label: string }[];
  acctList: { id: string; label: string }[];
  fubLabel: string;
  partingLabel: string;
  otherLabel: string;
  dislike: string;
  pairing: string;
  freeText: string;
  t: Messages;
  lang: Lang;
}

export function useDerived(): Derived {
  const { state } = useFormState();
  const { t, lang } = useLang();
  const char = getCharacter(state.selectedChar) ?? CHARACTERS[0];

  const seriesList = Array.from(state.selectedSeries)
    .map((id) => SERIES.find((s) => s.id === id))
    .filter((s): s is (typeof SERIES)[number] => Boolean(s))
    .sort((a, b) => SERIES.indexOf(a) - SERIES.indexOf(b))
    .map((s) => ({
      id: s.id,
      label: (s.num ? `TH${s.num} ` : '') + tr(s, lang),
    }));

  const acctList = ACCT_TYPES.filter((a) => state.selectedAcct.has(a.id)).map((a) => ({
    id: a.id,
    label: tr(a, lang),
  }));

  const fubLabel = state.fub === 'free' ? t.free : t.r4r;
  const partingLabel =
    state.parting === 'unfollow' ? t.unfollow : state.parting === 'blockunfollow' ? t.blockunfollow : t.block;
  const otherLabel =
    state.otherGenre === 'none' ? t.none : state.otherGenre === 'sometimes' ? t.sometimes : t.often;

  return {
    nickname: state.nickname.trim() || t.phNick,
    profileImage: state.profileImage,
    charName: tr(char, lang),
    charSrc: spriteUrl(char.rel),
    avatarSrc: state.profileImage ?? spriteUrl(char.rel),
    avatarIsPhoto: Boolean(state.profileImage),
    seriesList,
    acctList,
    fubLabel,
    partingLabel,
    otherLabel,
    dislike: state.dislike.trim() || t.phDis,
    pairing: state.pairing.trim() || t.phPair,
    freeText: state.freeText.trim(),
    t,
    lang,
  };
}
