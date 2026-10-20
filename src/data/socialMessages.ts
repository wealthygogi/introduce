import type { Lang } from './i18n';
import type { SocialPlatform } from '../lib/socialAccount';

export const socialMessages = {
  ko: {
    title: 'SNS QR 코드', optional: '선택', on: '사용 중', platform: '연결할 SNS', none: '사용 안 함',
    hint: '계정 하나만 연결해요. 카드 아래에 QR이 추가되며 저장 이미지에도 포함돼요.',
    account: '계정명 또는 프로필 URL', url: '연결할 URL', inputHint: '계정을 입력하면 QR이 자동으로 생성돼요.',
    invalid: '선택한 SNS의 계정명 또는 올바른 http(s) 프로필 URL을 입력해 주세요.',
    scan: 'QR을 스캔해 연결해요', other: '기타 링크',
  },
  ja: {
    title: 'SNS QRコード', optional: '任意', on: '使用中', platform: 'リンクするSNS', none: '使用しない',
    hint: 'アカウントは1つだけ。カードの下にQRを追加し、保存画像にも含めます。',
    account: 'ユーザー名またはプロフィールURL', url: 'リンク先URL', inputHint: '入力するとQRコードを自動生成します。',
    invalid: '選択したSNSのユーザー名、または正しいhttp(s)プロフィールURLを入力してください。',
    scan: 'QRをスキャンしてつながる', other: 'その他のリンク',
  },
  en: {
    title: 'Social QR code', optional: 'Optional', on: 'Enabled', platform: 'Social platform', none: 'Off',
    hint: 'Connect one account. A QR strip appears below the card and in the saved image.',
    account: 'Username or profile URL', url: 'Link URL', inputHint: 'Enter an account to generate its QR code automatically.',
    invalid: 'Enter a username for the selected platform or a valid http(s) profile URL.',
    scan: 'Scan to connect', other: 'Other link',
  },
};

export function socialPlatformName(platform: SocialPlatform, lang: Lang): string {
  return platform === 'other' ? socialMessages[lang].other : {
    twitter: 'Twitter (X)', instagram: 'Instagram', threads: 'Threads',
  }[platform];
}
