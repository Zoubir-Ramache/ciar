import { NextRequest } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { generateZipDownloadUrl, listPhotos } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const mode = req.nextUrl.searchParams.get('mode');
  let targetIds: string[] = [];

  if (mode === 'all') {
    const all = await listPhotos();
    targetIds = all.map((p) => p.public_id);
  } else {
    const formData = await req.formData();
    const ids = formData.getAll('public_ids');
    targetIds = ids.map((id) => id.toString());
  }

  if (targetIds.length === 0) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?msg=No+photos+were+selected+for+download.' },
    });
  }

  const dateTag = new Date().toISOString().substring(0, 10);
  const zipUrl = generateZipDownloadUrl(targetIds, `ciar-photos-${dateTag}`);

  return new Response(null, {
    status: 302,
    headers: { Location: zipUrl },
  });
}
