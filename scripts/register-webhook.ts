import readline from 'readline';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const botToken = process.env.BOT_TOKEN || (await ask('Enter BOT_TOKEN: '));
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || (await ask('Enter TELEGRAM_WEBHOOK_SECRET: '));
  const domain = (await ask('Enter your Vercel URL (e.g., https://ciar.vercel.app): ')).replace(/\/$/, '');

  const webhookUrl = `${domain}/api/telegram/webhook`;
  console.log(`\nRegistering webhook: ${webhookUrl} ...`);

  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: webhookSecret,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();
  if (data.ok) {
    console.log('Webhook registered successfully!');
    console.log('Telegram API response:', data);
  } else {
    console.error('Failed to register webhook:', data);
  }
}

main().catch(console.error);
