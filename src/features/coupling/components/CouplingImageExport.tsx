import type { ReactNode } from 'react';
import { useLang } from '../../../contexts/LangContext';
import { RELATIONS } from '../relations';
import DownloadButton from '../../../components/DownloadButton';
import './coupling-image-export.css';

interface Props {
  id: string;
  filename: string;
  title: string;
  scope: string;
  children: ReactNode;
}

export default function CouplingImageExport({ id, filename, title, scope, children }: Props) {
  const { lang } = useLang();
  return <>
    <div className="coupling-image-export-control"><DownloadButton targetId={id} filename={filename} captureOptions={{ scale: 1, resetPosition: true, maxPixelArea: 16_000_000 }} /></div>
    <section id={id} className="coupling-image-export" aria-hidden="true">
      <header><h1>{title}</h1><p>{scope}</p></header>
      {children}
      <div className="coupling-export-legend">{RELATIONS.map(relation => <span key={relation.id} style={{ '--export-relation': relation.color } as React.CSSProperties}><b>{relation.symbol}</b>{relation.label[lang]}</span>)}</div>
    </section>
  </>;
}
