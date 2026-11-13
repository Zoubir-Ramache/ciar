import { NextRequest } from 'next/server';
import { Readable } from 'stream';
import { config } from '@/lib/config';
import { TelegramUpdate } from '@/types';
import { getTelegramFileUrl, sendTelegramMessage } from '@/lib/telegram';
import { uploadStreamToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
  if (secretHeader !== config.telegramWebhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const update: TelegramUpdate = await req.json();
  const message = update.message;
  if (!message) {
    return new Response('OK', { status: 200 });
  }

  const senderId = message.from?.id;
  const senderName = message.from?.first_name || message.from?.username || 'User';
  const chatId = message.chat.id;

  // Open access: any Telegram user can send photos


  let fileId: string | null = null;
  let originalFilename = `photo_${Date.now()}.jpg`;

  if (message.document) {
    const doc = message.document;
    const mime = doc.mime_type || '';
    if (mime.startsWith('image/') || mime === 'application/octet-stream') {
      fileId = doc.file_id;
      if (doc.file_name) originalFilename = doc.file_name;
    }
  } else if (message.photo && message.photo.length > 0) {
    const bestPhoto = message.photo[message.photo.length - 1];
    fileId = bestPhoto.file_id;
    originalFilename = `photo_${Date.now()}_${bestPhoto.file_unique_id}.jpg`;
  }

  if (!fileId) {
    return new Response('OK', { status: 200 });
  }

  try {
    const fileUrl = await getTelegramFileUrl(fileId);
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok || !fileRes.body) {
      throw new Error(`Failed to fetch file from Telegram: ${fileRes.statusText}`);
    }

    const nodeStream = Readable.fromWeb(fileRes.body as any);
    const dateTag = new Date().toISOString().substring(0, 10);
    const carLabel = message.caption?.trim() || undefined;

    await uploadStreamToCloudinary(nodeStream, {
      originalFilename,
      carLabel,
      senderId,
      senderName,
      uploadDateTag: `date_${dateTag}`,
    });

    const labelText = carLabel ? ` [${carLabel}]` : '';
    await sendTelegramMessage(chatId, `Saved: ${originalFilename}${labelText}`);
  } catch (err: any) {
    console.error('Error handling Telegram photo upload:', err);
    await sendTelegramMessage(chatId, `Failed to save photo: ${err.message || 'Server error'}`);
  }

  return new Response('OK', { status: 200 });
}
