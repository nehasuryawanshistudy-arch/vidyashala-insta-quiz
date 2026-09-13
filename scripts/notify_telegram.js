import fs from 'fs';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RUN_ID = process.env.GITHUB_RUN_ID || Date.now().toString();

if (!BOT_TOKEN || !CHAT_ID) {
  console.log("Skipping Telegram - no secrets");
  process.exit(0);
}

const caption = fs.readFileSync('output/caption.txt', 'utf-8');
const title = fs.readFileSync('output/title.txt', 'utf-8');
const questions = fs.readFileSync('output/questions.txt', 'utf-8');
const videoPath = 'output/reel.mp4';

const replyMarkup = {
  inline_keyboard: [[
    { text: "✅ Approve & Post", callback_data: `approve_${RUN_ID}` },
    { text: "❌ Reject", callback_data: `reject_${RUN_ID}` }
  ]]
};

console.log("Sending to Telegram...");
const form = new FormData();
form.append('chat_id', CHAT_ID);
form.append('caption', `*${title}*\n\n${caption}\n\nRun: \`${RUN_ID}\``);
form.append('parse_mode', 'Markdown');
form.append('reply_markup', JSON.stringify(replyMarkup));
form.append('video', new Blob([fs.readFileSync(videoPath)]), 'reel.mp4');

let res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, { method: 'POST', body: form });
let data = await res.json();
if (!data.ok) { console.error(data); process.exit(1); }

await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: CHAT_ID,
    text: `Questions:\n\`\`\`\n${questions.slice(0, 3500)}\n\`\`\`\n\nTo edit caption send:\nEDIT: your new caption`,
    parse_mode: 'Markdown'
  })
});
console.log("Sent");
