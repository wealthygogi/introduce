import { useMemo, useState } from 'react';
import { PROFILE_CHARACTERS, PROFILE_WORKS } from '../../../../data/profileCatalog';
import { useLang } from '../../../../contexts/LangContext';
import type { RandomCopy } from '../copy';
import type { PreferenceSignals, RandomSettings } from '../types';
import { DRAW_COUNTS } from '../drawPool';
import { allAppearances } from '../../characterCategories';

export type FilterProps = {
  settings: RandomSettings;
  onChange: (patch: Partial<RandomSettings>) => void;
  copy: RandomCopy;
  signals: PreferenceSignals | null;
  poolCount: number;
  onReset: () => void;
};

export default function RandomFilterPanel({ settings, onChange, copy, signals, poolCount, onReset }: FilterProps) {
  const { lang } = useLang();
  const [workQuery, setWorkQuery] = useState('');
  const scopeWorks = useMemo(() => settings.scope === 'books'
      ? PROFILE_WORKS.filter(work => work.category === 'book')
      : PROFILE_WORKS.filter(work => work.category === 'game' && (
        settings.scope === 'all'
          ? true
          : settings.scope === 'mainline'
            ? /^th(?:[6-9]|1\d|20)$/.test(work.id)
            : settings.scope === 'pc98'
              ? /^th[1-5]$/.test(work.id)
              : !/^th(?:[1-9]|1\d|20)$/.test(work.id)
       )), [settings.scope]);
  const works = useMemo(() => {
    const query = workQuery.trim().toLowerCase();
    return query ? scopeWorks.filter(work => `${work.ko} ${work.ja} ${work.en}`.toLowerCase().includes(query)) : scopeWorks;
  }, [scopeWorks, workQuery]);
  const stageOptions = useMemo(() => {
    const allowedWorkIds = new Set(settings.workIds.length
      ? settings.workIds.filter(id => scopeWorks.some(work => work.id === id))
      : scopeWorks.map(work => work.id));
    const available = new Set<NonNullable<RandomSettings['stage']>>();
    for (const character of PROFILE_CHARACTERS) {
      for (const appearance of allAppearances(character.id)) {
        if (allowedWorkIds.has(appearance.workId) && appearance.stage !== null) available.add(appearance.stage);
      }
    }
    return [...available].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      if (typeof a === 'number') return -1;
      if (typeof b === 'number') return 1;
      return ['final', 'extra', 'phantasm'].indexOf(a) - ['final', 'extra', 'phantasm'].indexOf(b);
    });
  }, [settings.workIds, scopeWorks]);

  const toggleWork = (id: string) => {
    onChange({
      workIds: settings.workIds.includes(id)
        ? settings.workIds.filter(item => item !== id)
        : [...settings.workIds, id],
    });
  };
  const toggleRole = (role: RandomSettings['roles'][number]) => {
    const next = settings.roles.includes(role)
      ? settings.roles.filter(item => item !== role)
      : [...settings.roles, role];
    onChange({ roles: next });
  };
  const stageDisabled = settings.scope === 'books';
  const scopes = ['all', 'mainline', 'pc98', 'spinoff', 'books'] as const;
  const roles = ['playable', 'enemy', 'boss', 'midboss', 'opponent', 'support', 'other'] as const;

  return <div className="random-filter-panel">
    <div className="random-filter-heading">
      <h2>{copy.filters}</h2>
      <button type="button" className="random-text-button" onClick={onReset}>{copy.resetFilters}</button>
    </div>

    <fieldset className="random-filter-group">
      <legend>{copy.count}</legend>
      <div className="random-segment">
        {DRAW_COUNTS.map(count => (
          <button key={count} type="button" aria-pressed={settings.count === count} onClick={() => onChange({ count })}>{copy.counts[count]}</button>
        ))}
      </div>
    </fieldset>

    <label className="random-field">
      <span>{copy.scope}</span>
      <select value={settings.scope} onChange={event => {
        const scope = event.target.value as RandomSettings['scope'];
        onChange({ scope, workIds: [], ...(scope === 'books' ? { roles: [], stage: null } : {}) });
      }}>
        {scopes.map(scope => <option key={scope} value={scope}>{copy.scopes[scope]}</option>)}
      </select>
    </label>

    <details className="random-work-picker">
      <summary>{copy.works} <span>{settings.workIds.length > 0 ? `(${settings.workIds.length})` : ''}</span></summary>
      <label className="random-field">
        <span>{copy.searchWorks}</span>
        <input type="search" value={workQuery} onChange={event => setWorkQuery(event.target.value)} placeholder={copy.searchWorks} />
      </label>
      <div className="random-work-actions">
        <button type="button" className="random-text-button" onClick={() => onChange({ workIds: works.map(work => work.id) })}>{copy.selectAll}</button>
        <button type="button" className="random-text-button" onClick={() => onChange({ workIds: [] })}>{copy.clearAll}</button>
      </div>
      <div className="random-work-list">
        {works.map(work => <label key={work.id}>
          <input type="checkbox" checked={settings.workIds.includes(work.id)} onChange={() => toggleWork(work.id)} />
          <span>{work[lang]}</span>
        </label>)}
      </div>
    </details>

    <fieldset className="random-filter-group">
      <legend>{copy.roles}</legend>
      <div className="random-chip-grid">
        {roles.map(role => <button key={role} type="button" aria-pressed={settings.roles.includes(role)} disabled={settings.scope === 'books'} onClick={() => toggleRole(role)}>{copy.roleLabels[role]}</button>)}
      </div>
    </fieldset>

    <label className="random-field">
      <span>{copy.stage}</span>
      <select disabled={stageDisabled} value={settings.stage ?? ''} onChange={event => {
        const value = event.target.value;
        onChange({ stage: value ? (/^\d+$/.test(value) ? Number(value) : value as RandomSettings['stage']) : null });
      }}>
        <option value="">{copy.allStages}</option>
        {stageOptions.map(stage => <option key={stage} value={stage}>{typeof stage === 'number' ? copy.stageNumber(stage) : copy.stageLabels[stage]}</option>)}
      </select>
      <small className="random-hint">{stageDisabled ? copy.stageUnavailable : copy.stageHint}</small>
    </label>

    <fieldset className="random-filter-group">
      <legend>{copy.mode}</legend>
      <div className="random-segment">
        {(['pool', 'balanced'] as const).map(mode => <button key={mode} type="button" aria-pressed={settings.mode === mode} onClick={() => onChange({ mode })}>{copy.modes[mode]}</button>)}
      </div>
      <p className="random-hint">{copy.modeHint}</p>
    </fieldset>

    <div className="random-filter-group">
      <label className="random-switch">
        <input type="checkbox" checked={settings.reflectPreferences} onChange={event => onChange({ reflectPreferences: event.target.checked })} />
        <span>{copy.personalization}</span>
      </label>
      <p className="random-hint">{copy.personalizationHint}</p>
      {settings.reflectPreferences && signals && <p className="random-preference-count">{copy.preferenceCount(signals.favorite.size, signals.interested.size, signals.avoid.size)}</p>}
      {settings.reflectPreferences && signals?.warning && <p className="random-warning" role="status">{copy.preferenceWarning}</p>}
      <label className="random-switch">
        <input type="checkbox" checked={settings.excludeRecent} onChange={event => onChange({ excludeRecent: event.target.checked })} />
        <span>{copy.excludeRecent}</span>
      </label>
    </div>

    <p className="random-pool-count" role="status">{copy.pool(poolCount)}</p>
  </div>;
}
