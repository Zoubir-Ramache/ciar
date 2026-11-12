import { NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { purgeOldPhotos } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (config.cronSecret && authHeader !== `Bearer ${config.cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const deletedCount = await purgeOldPhotos(config.retentionDays);
    return Response.json({
      success: true,
      deleted: deletedCount,
      retentionDays: config.retentionDays,
    });
  } catch (error: any) {
    console.error('Retention purge failed:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
