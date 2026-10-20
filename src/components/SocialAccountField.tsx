import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { resolveSocialAccount, SOCIAL_PLATFORMS, type SocialPlatform } from '../lib/socialAccount';
import { socialMessages, socialPlatformName } from '../data/socialMessages';

export default function SocialAccountField() {
  const { state, set } = useFormState();
  const { lang } = useLang();
  const m = socialMessages[lang];
  const enabled = state.socialPlatform !== 'none';
  const account = enabled ? resolveSocialAccount(state.socialPlatform as SocialPlatform, state.socialAccount) : null;
  const invalid = enabled && !!state.socialAccount.trim() && !account;

  return (
    <details className="social-settings" open={enabled || undefined}>
      <summary className="form-label">{m.title}<span className="form-hint">{enabled ? m.on : m.optional}</span></summary>
      <div className="form-section social-settings-body">
        <p className="form-hint">{m.hint}</p>
        <label className="form-label" htmlFor="social-platform">{m.platform}</label>
        <select id="social-platform" className="form-input" value={state.socialPlatform}
          onChange={(e) => { set('socialPlatform', e.target.value as SocialPlatform | 'none'); set('socialAccount', ''); }}>
          <option value="none">{m.none}</option>
          {SOCIAL_PLATFORMS.map((platform) => <option key={platform} value={platform}>{socialPlatformName(platform, lang)}</option>)}
        </select>
        {enabled && <>
          <label className="form-label" htmlFor="social-account">{state.socialPlatform === 'other' ? m.url : m.account}</label>
          <input id="social-account" className="form-input" type="text" value={state.socialAccount} maxLength={300}
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            placeholder={state.socialPlatform === 'other' ? 'https://example.com/me' : '@username'}
            aria-invalid={invalid} aria-describedby="social-feedback"
            onChange={(e) => set('socialAccount', e.target.value)} />
          <p id="social-feedback" className={`form-hint${invalid ? ' social-error' : ''}`} role="status">
            {invalid ? m.invalid : account ? account.url : m.inputHint}
          </p>
        </>}
      </div>
    </details>
  );
}
