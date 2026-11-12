import { NextRequest } from 'next/server';
import {
  isValidSession,
  createSessionCookie,
  getSessionCookieHeader,
  getFailedAttempts,
  createAttemptsCookie,
  clearAttemptsCookie,
} from '@/lib/auth';
import { config } from '@/lib/config';
import { renderLoginPage } from '@/views/login.html';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (isValidSession(cookieHeader)) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/' },
    });
  }

  const html = renderLoginPage();
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  const attempts = getFailedAttempts(cookieHeader);

  if (attempts >= 5) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const formData = await req.formData();
  const password = formData.get('password')?.toString() || '';

  if (password === config.sitePassword) {
    const sessionToken = createSessionCookie();
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/',
        'Set-Cookie': `${getSessionCookieHeader(sessionToken)}, ${clearAttemptsCookie()}`,
      },
    });
  }

  const nextAttempts = attempts + 1;
  const html = renderLoginPage('Incorrect password. Please try again.');
  return new Response(html, {
    status: 401,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': createAttemptsCookie(nextAttempts),
    },
  });
}
