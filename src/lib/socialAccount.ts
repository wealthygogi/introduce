export type SocialPlatform = 'twitter' | 'instagram' | 'threads' | 'other';

export const SOCIAL_PLATFORMS: SocialPlatform[] = ['twitter', 'instagram', 'threads', 'other'];

const PROFILES = {
  twitter: {
    hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
    base: 'https://x.com/',
    handle: /^[A-Za-z0-9_]{1,15}$/,
  },
  instagram: {
    hosts: ['instagram.com', 'www.instagram.com'],
    base: 'https://www.instagram.com/',
    handle: /^[A-Za-z0-9_](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9_])?$/,
  },
  threads: {
    hosts: ['threads.com', 'www.threads.com', 'threads.net', 'www.threads.net'],
    base: 'https://www.threads.com/@',
    handle: /^[A-Za-z0-9_](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9_])?$/,
  },
};

/** Resolve a single handle or profile URL locally; never look up the account. */
export function resolveSocialAccount(
  platform: SocialPlatform,
  input: string,
): { url: string; label: string } | null {
  if (input.length > 300) return null;
  const value = input.trim();
  if (!value || /[\u0000-\u001f\u007f\\]/.test(value)) return null;

  if (platform === 'other') {
    if (!/^https?:\/\//i.test(value)) return null;
    try {
      const url = new URL(value);
      if (!url.hostname) return null;
      return { url: url.href, label: url.hostname };
    } catch {
      return null;
    }
  }

  const profile = PROFILES[platform];
  let handle = value.startsWith('@') ? value.slice(1) : value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (!profile.hosts.includes(url.hostname) || url.username || url.password || url.port) return null;
      // Inspect the original path, before URL normalizes away extra dot segments.
      const path = value.match(/^https?:\/\/[^/?#]+(\/[^?#]*)?(?:[?#]|$)/i)?.[1] ?? '';
      const match = path.match(platform === 'threads' ? /^\/@([^/]+)\/?$/ : /^\/([^/]+)\/?$/);
      if (!match) return null;
      handle = match[1];
    } catch {
      return null;
    }
  }

  if (!profile.handle.test(handle)) return null;
  return { url: `${profile.base}${handle}`, label: `@${handle}` };
}
