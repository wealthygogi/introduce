import { useLang } from '../../../contexts/LangContext';
import { RELATIONS } from '../relations';

const title = {
  ko: { short: '관계', full: '관계 색상 범례' },
  ja: { short: '関係', full: '関係色の凡例' },
  en: { short: 'Relationships', full: 'Relationship color legend' },
} as const;

export default function RelationLegend() {
  const { lang } = useLang();
  return <div className="coupling-relation-legend" role="group" aria-label={title[lang].full}>
    <span className="coupling-relation-legend-title">{title[lang].short}</span>
    <ul>{RELATIONS.map(relation => <li key={relation.id} data-relation={relation.id} style={{ '--relation-color': relation.color } as React.CSSProperties}>
      <span className="coupling-relation-legend-swatch" aria-hidden="true" />
      <span className="coupling-relation-legend-symbol" aria-hidden="true">{relation.symbol}</span>
      <span>{relation.label[lang]}</span>
    </li>)}</ul>
  </div>;
}
