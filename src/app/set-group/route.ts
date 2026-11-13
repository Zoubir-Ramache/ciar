import { NextRequest } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { updateCarLabel } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const formData = await req.formData();
  const ids = formData.getAll('public_ids').map((id) => id.toString());
  const carLabel = formData.get('car_label')?.toString().trim() || '';

  if (ids.length === 0) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?msg=Please+select+at+least+one+photo+to+group.' },
    });
  }

  if (!carLabel) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?msg=Please+enter+a+car+name+or+label.' },
    });
  }

  try {
    await updateCarLabel(ids, carLabel);
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/?msg=Successfully+grouped+${ids.length}+photo(s)+under+'${encodeURIComponent(carLabel)}'.`,
      },
    });
  } catch (err: any) {
    console.error('Failed to update car label:', err);
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/?msg=Failed+to+update+group:+${encodeURIComponent(err.message)}`,
      },
    });
  }
}
