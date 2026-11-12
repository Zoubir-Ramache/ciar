import { NextRequest } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { listPhotos } from '@/lib/cloudinary';
import { renderGalleryPage } from '@/views/gallery.html';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/login' },
    });
  }

  try {
    const photos = await listPhotos();
    const alertParam = req.nextUrl.searchParams.get('msg') || undefined;
    const html = renderGalleryPage(photos, alertParam);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Failed to list photos:', error);
    return new Response(`Error loading photos from Cloudinary: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
