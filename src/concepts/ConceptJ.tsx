import { useDerived } from '../hooks/useDerived';
import { spriteUrl } from '../data/characters';
import './ConceptJ.css';

export default function ConceptJ() {
  const d = useDerived();

  // fake "profile loading" percentage — a base for the always-present
  // fields, plus a slice for each optional field the user actually filled
  const filledCount = [d.seriesList.length > 0, d.acctList.length > 0, Boolean(d.freeText)].filter(Boolean).length;
  const loadPct = 40 + filledCount * 20;

  // arcade high score — nickname+reroll seeded roll, reacts to 🎲; a custom pin overrides it via
  // the card-only field. Classic arcade scores end in a zero (the last digit usually isn't
  // tallied), so roll the /10 value and scale back up.
  const autoHiScore = String(d.rollInt('hiScore', 0, 99999999) * 10).padStart(9, '0');
  const hiScore = d.getCustom('hiScore', autoHiScore);

  return (
    <div
      id="preview-card"
      className="card-frame"
      style={{ background: '#101820', border: '2px solid #4dd0e1', boxShadow: 'none', overflow: 'hidden' }}
    >
      <div className="cj-card">
        <img
          className="px cj-mascot"
          src={spriteUrl('4. Other/[1] Main Characters/Marisa Kirisame.png')}
          alt=""
          aria-hidden="true"
        />

        <div className="cj-screen">
          <div className="cj-boxcap">╔══════ SYSTEM READY ══════╗</div>
          <div className="cj-bootline">TOUHOU BASIC SYSTEM v2.56</div>
          <div className="cj-bootline cj-dim">COPYRIGHT (C) ZUN SOFT 1996-2026</div>
          <div className="cj-bootline cj-dim">640KB MEMORY OK</div>

          <div className="cj-load">
            <span className="cj-load-label">LOADING PROFILE...</span>
            <div className="cj-load-track">
              <div className="cj-load-fill" style={{ width: `${loadPct}%` }} />
            </div>
            <span className="cj-load-pct">{loadPct}%</span>
          </div>

          <div className="cj-hiscore">
            <span className="cj-hiscore-label">HI-SCORE</span>
            <span className="cj-hiscore-value">{hiScore}</span>
          </div>

          <div className="cj-block">
            <div className="cj-prompt">
              <span className="cj-path">C:\GENSOKYO&gt;</span> <span className="cj-cmd">WHOAMI</span>
            </div>
            <div className="cj-kv">
              <span className="cj-k">NAME</span>
              <span className="cj-v">{d.nickname}</span>
            </div>
            <div className="cj-kv">
              <span className="cj-k">CHAR</span>
              <span className="cj-v cj-v-char">
                <img className="px cj-sprite" src={d.charSrc} alt="" />
                {d.charName}
              </span>
            </div>
          </div>

          <div className="cj-block">
            <div className="cj-prompt">
              <span className="cj-path">C:\GENSOKYO&gt;</span> <span className="cj-cmd">DIR SERIES\</span>
            </div>
            <div className="cj-dir">
              {d.seriesList.length === 0 ? (
                <div className="cj-dirrow cj-empty">
                  <span>{d.t.notSelected}</span>
                </div>
              ) : (
                d.seriesList.map((s) => (
                  <div className="cj-dirrow" key={s.id}>
                    <span className="cj-dir-name">{s.label}</span>
                    <span className="cj-dir-flag">&lt;DIR&gt;</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cj-block">
            <div className="cj-prompt">
              <span className="cj-path">C:\GENSOKYO&gt;</span> <span className="cj-cmd">DIR ACCOUNT\</span>
            </div>
            <div className="cj-dir">
              {d.acctList.length === 0 ? (
                <div className="cj-filerow cj-empty">
                  <span>{d.t.notSelected}</span>
                </div>
              ) : (
                d.acctList.map((a, i) => (
                  <div className="cj-filerow" key={a.id}>
                    <span className="cj-file-name">{a.label}</span>
                    <span className="cj-file-ext">.SYS</span>
                    <span className="cj-file-size">{(i + 1) * 4}KB</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cj-block">
            <div className="cj-prompt">
              <span className="cj-path">C:\GENSOKYO&gt;</span> <span className="cj-cmd">TYPE CONFIG.SYS</span>
            </div>
            <div className="cj-config">
              <div className="cj-config-row">
                <span className="cj-config-key">&gt; {d.t.fub}:</span> <span className="cj-config-val">{d.fubLabel}</span>
              </div>
              <div className="cj-config-row">
                <span className="cj-config-key">&gt; {d.t.parting}:</span>{' '}
                <span className="cj-config-val">{d.partingLabel}</span>
              </div>
              <div className="cj-config-row">
                <span className="cj-config-key">&gt; {d.t.otherGenre}:</span>{' '}
                <span className="cj-config-val">{d.otherLabel}</span>
              </div>
              <div className="cj-config-row">
                <span className="cj-config-key">&gt; {d.t.dislike}:</span>{' '}
                <span className="cj-config-val">{d.dislike}</span>
              </div>
              <div className="cj-config-row">
                <span className="cj-config-key">&gt; {d.t.pairing}:</span>{' '}
                <span className="cj-config-val">{d.pairing}</span>
              </div>
            </div>
          </div>

          {d.freeText && (
            <div className="cj-block">
              <div className="cj-prompt">
                <span className="cj-path">C:\GENSOKYO&gt;</span> <span className="cj-cmd">TYPE MESSAGE.TXT</span>
              </div>
              <div className="cj-message">{d.freeText}</div>
            </div>
          )}

          <div className="cj-prompt cj-final">
            <span className="cj-path">C:\GENSOKYO&gt;</span> <span className="cj-cursor" aria-hidden="true">█</span>
          </div>

          <div className="cj-boxcap">╚═══════════════════════════╝</div>
        </div>

        <div className="cj-footer">Touhou Project © ZUN · Sprites by Majstek</div>
      </div>
    </div>
  );
}
