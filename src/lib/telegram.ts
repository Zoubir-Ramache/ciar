import { config } from './config';

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram sendMessage error:', err);
    }
  } catch (error) {
    console.error('Failed to send Telegram confirmation:', error);
  }
}

export async function getTelegramFileUrl(fileId: string): Promise<string> {
  const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (!data.ok || !data.result?.file_path) {
    throw new Error(`Failed to resolve Telegram file path: ${data.description || 'Unknown'}`);
  }
  return `https://api.telegram.org/file/bot${config.botToken}/${data.result.file_path}`;
}
