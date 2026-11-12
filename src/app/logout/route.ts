import { NextRequest } from 'next/server';
import { getClearSessionCookieHeader } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/login',
      'Set-Cookie': getClearSessionCookieHeader(),
    },
  });
}
