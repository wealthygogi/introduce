import { QRCodeSVG } from 'qrcode.react';
import { useFormState } from '../contexts/FormStateContext';
import { useLang } from '../contexts/LangContext';
import { resolveSocialAccount } from '../lib/socialAccount';
import { socialMessages, socialPlatformName } from '../data/socialMessages';
import './SocialQr.css';

export default function SocialQrFooter() {
  const { state } = useFormState();
  const { lang } = useLang();
  if (state.socialPlatform === 'none') return null;
  const account = resolveSocialAccount(state.socialPlatform, state.socialAccount);
  if (!account) return null;
  const platform = socialPlatformName(state.socialPlatform, lang);

  return (
    <a className="social-qr-footer" href={account.url} target="_blank" rel="noopener noreferrer"
      aria-label={`${platform}: ${account.label}`}>
      <div className="social-qr-copy">
        <span className="social-qr-platform">{platform}</span>
        <strong className="social-qr-account">{account.label}</strong>
        <span className="social-qr-caption">{socialMessages[lang].scan}</span>
      </div>
      <QRCodeSVG value={account.url} size={112} level="M" marginSize={4}
        bgColor="#ffffff" fgColor="#000000" title={`${platform}: ${account.label}`} />
    </a>
  );
}
