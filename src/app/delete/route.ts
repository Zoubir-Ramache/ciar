import { NextRequest } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { deletePhotos } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const formData = await req.formData();
  const ids = formData.getAll('public_ids').map((id) => id.toString());

  if (ids.length > 0) {
    await deletePhotos(ids);
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/?msg=Successfully+deleted+${ids.length}+photo(s).` },
  });
}
