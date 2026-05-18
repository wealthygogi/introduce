import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { CONCEPTS } from '../concepts/registry';
import { spriteUrl } from '../data/characters';

export default function Landing() {
  const { t } = useLang();

  return (
    <div>
      <section className="hero">
        <div className="hero-sprites" aria-hidden>
          <img className="px" src={spriteUrl('1. Mainline Games/[6] Koumakyou ~ Embodiment of Scarlet Devil/Remilia Scarlet.png')} alt="" />
          <img className="px mid" src={spriteUrl('4. Other/[1] Main Characters/Reimu Hakurei.png')} alt="" />
          <img className="px" src={spriteUrl('4. Other/[1] Main Characters/Marisa Kirisame.png')} alt="" />
        </div>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroDesc}</p>
      </section>

      <div className="grid">
        {CONCEPTS.map((c) => (
          <Link to={`/concept/${c.id}`} key={c.id} className="concept-card">
            <div className="preview">
              <img className="px" src={spriteUrl(c.sprite)} alt="" />
              <span className="label">{c.tag}</span>
            </div>
            <div className="body">
              <span className="badge">CONCEPT {c.id.toUpperCase()}</span>
              <span className="name">{c.name(t)}</span>
              <span className="desc">{c.desc(t)}</span>
              <span className="cta">
                {t.startCta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
