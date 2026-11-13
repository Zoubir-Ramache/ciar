import { NextRequest } from 'next/server';
import { isValidSession } from '@/lib/auth';
import { generateZipDownloadUrl, listPhotos } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const group = req.nextUrl.searchParams.get('group') || '';
  if (!group) {
    return new Response(null, { status: 303, headers: { Location: '/' } });
  }

  const allPhotos = await listPhotos();
  const matchingPhotos = allPhotos.filter((p) => {
    const carLabel = p.context?.car_label?.trim() || p.context?.custom?.car_label?.trim();
    const dateStr = p.created_at ? p.created_at.substring(0, 10) : 'Recent';
    const groupKey = carLabel ? carLabel : `Uploaded on ${dateStr}`;
    return groupKey.toLowerCase() === group.toLowerCase();
  });

  if (matchingPhotos.length === 0) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?msg=No+photos+found+in+this+group.' },
    });
  }

  const targetIds = matchingPhotos.map((p) => p.public_id);
  // Name the zip directly after the car caption/group! E.g. Toyota_Corolla.zip
  const zipUrl = generateZipDownloadUrl(targetIds, group);

  return new Response(null, {
    status: 302,
    headers: { Location: zipUrl },
  });
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const mode = req.nextUrl.searchParams.get('mode');
  const groupParam = req.nextUrl.searchParams.get('group');
  let targetIds: string[] = [];
  let zipName = groupParam || '';

  const allPhotos = await listPhotos();

  if (mode === 'all') {
    targetIds = allPhotos.map((p) => p.public_id);
    const dateTag = new Date().toISOString().substring(0, 10);
    zipName = `all-cars-${dateTag}`;
  } else if (groupParam) {
    const matching = allPhotos.filter((p) => {
      const carLabel = p.context?.car_label?.trim() || p.context?.custom?.car_label?.trim();
      const dateStr = p.created_at ? p.created_at.substring(0, 10) : 'Recent';
      const groupKey = carLabel ? carLabel : `Uploaded on ${dateStr}`;
      return groupKey.toLowerCase() === groupParam.toLowerCase();
    });
    targetIds = matching.map((p) => p.public_id);
    zipName = groupParam;
  } else {
    const formData = await req.formData();
    const ids = formData.getAll('public_ids');
    targetIds = ids.map((id) => id.toString());
    const explicitZipName = formData.get('zip_name')?.toString().trim();
    if (explicitZipName) {
      zipName = explicitZipName;
    } else {
      // If all selected photos share the same car_label, name the ZIP after that car!
      const selectedPhotos = allPhotos.filter((p) => targetIds.includes(p.public_id));
      const labels = Array.from(
        new Set(
          selectedPhotos
            .map((p) => p.context?.car_label?.trim() || p.context?.custom?.car_label?.trim())
            .filter((l): l is string => Boolean(l))
        )
      );
      if (labels.length === 1) {
        zipName = labels[0];
      } else {
        const dateTag = new Date().toISOString().substring(0, 10);
        zipName = `selected-cars-${dateTag}`;
      }
    }
  }

  if (targetIds.length === 0) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?msg=No+photos+were+selected+for+download.' },
    });
  }

  const zipUrl = generateZipDownloadUrl(targetIds, zipName);

  return new Response(null, {
    status: 302,
    headers: { Location: zipUrl },
  });
}
