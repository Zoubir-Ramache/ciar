import { NextRequest } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { cloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const id = req.nextUrl.searchParams.get('id');
  const filename = req.nextUrl.searchParams.get('name') || `photo_${Date.now()}.jpg`;

  if (!id) {
    return new Response(null, { status: 303, headers: { Location: '/' } });
  }

  try {
    const assetUrl = cloudinary.url(id, { secure: true });
    const upstreamRes = await fetch(assetUrl);

    if (!upstreamRes.ok || !upstreamRes.body) {
      // Fallback redirect if fetch fails
      return new Response(null, {
        status: 302,
        headers: { Location: assetUrl },
      });
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';

    // Stream directly to the user with the friendly day-based filename!
    return new Response(upstreamRes.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('Failed to stream photo download:', err);
    return new Response(null, { status: 303, headers: { Location: '/' } });
  }
}
