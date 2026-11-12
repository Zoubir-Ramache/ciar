import crypto from 'crypto';
import { config } from './config';

const COOKIE_NAME = 'ciar_session';
const ATTEMPTS_COOKIE = 'ciar_attempts';

function createHmacSignature(value: string): string {
  return crypto.createHmac('sha256', config.sessionSecret).update(value).digest('hex');
}

export function createSessionCookie(): string {
  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payload = `${expiresAt}`;
  const sig = createHmacSignature(payload);
  return `${payload}.${sig}`;
}

export function isValidSession(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;

  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies[COOKIE_NAME];
  if (!sessionToken) return false;

  const parts = sessionToken.split('.');
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expectedSig = createHmacSignature(payload);

  try {
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      const expiresAt = parseInt(payload, 10);
      return !isNaN(expiresAt) && expiresAt > Date.now();
    }
  } catch {
    return false;
  }

  return false;
}

export function getFailedAttempts(cookieHeader: string | null): number {
  if (!cookieHeader) return 0;
  const cookies = parseCookies(cookieHeader);
  const token = cookies[ATTEMPTS_COOKIE];
  if (!token) return 0;

  const [countStr, sig] = token.split('.');
  if (!countStr || !sig) return 0;

  const expectedSig = createHmacSignature(countStr);
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      const count = parseInt(countStr, 10);
      return isNaN(count) ? 0 : count;
    }
  } catch {
    return 0;
  }
  return 0;
}

export function createAttemptsCookie(count: number): string {
  const payload = `${count}`;
  const sig = createHmacSignature(payload);
  return `${ATTEMPTS_COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`;
}

export function clearAttemptsCookie(): string {
  return `${ATTEMPTS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionCookieHeader(value: string): string {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${14 * 24 * 3600}`;
}

export function getClearSessionCookieHeader(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function parseCookies(header: string): Record<string, string> {
  const list: Record<string, string> = {};
  header.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (!name) return;
    list[name.trim()] = rest.join('=').trim();
  });
  return list;
}
