function getEnv(key: string, defaultValue: string = ''): string {
  const value = process.env[key] || defaultValue;
  return value;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`[Warning] Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

export const config = {
  botToken: getRequiredEnv('BOT_TOKEN'),
  telegramWebhookSecret: getRequiredEnv('TELEGRAM_WEBHOOK_SECRET'),
  allowedUserIds: (process.env.ALLOWED_USER_IDS || '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
  sitePassword: getRequiredEnv('SITE_PASSWORD'),
  sessionSecret: getRequiredEnv('SESSION_SECRET') || 'default_fallback_session_secret_change_in_production',
  cloudinary: {
    cloudName: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
    apiKey: getRequiredEnv('CLOUDINARY_API_KEY'),
    apiSecret: getRequiredEnv('CLOUDINARY_API_SECRET'),
  },
  retentionDays: parseInt(process.env.RETENTION_DAYS || '7', 10),
  cronSecret: process.env.CRON_SECRET || '',
};
