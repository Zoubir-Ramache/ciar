import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { isValidSession } from '@/lib/auth';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie');
  if (!isValidSession(cookieHeader)) {
    return new Response(null, { status: 303, headers: { Location: '/login' } });
  }

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  const carLabel = formData.get('car_label')?.toString().trim() || undefined;

  if (!files || files.length === 0 || (files.length === 1 && files[0].size === 0)) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/?msg=No+files+were+selected+for+upload.' },
    });
  }

  const dateTag = new Date().toISOString().substring(0, 10);
  let count = 0;

  for (const file of files) {
    if (file.size === 0) continue;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const nodeStream = Readable.from(buffer);

    await uploadStreamToCloudinary(nodeStream, {
      originalFilename: file.name || `file_${Date.now()}`,
      carLabel,
      senderName: 'Web Upload',
      uploadDateTag: `date_${dateTag}`,
    });
    count++;
  }

  return new Response(null, {
    status: 303,
    headers: { Location: `/?msg=Successfully+uploaded+${count}+file(s).` },
  });
}
