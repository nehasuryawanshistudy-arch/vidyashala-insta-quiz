const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const RUN_ID = process.env.GITHUB_RUN_ID || process.argv[2];
const TIMEOUT_HOURS = 2;

if (!BOT_TOKEN) {
  console.log("No Telegram token - auto approving for local");
  process.exit(0);
}

let offset = 0;
const start = Date.now();
const timeoutMs = TIMEOUT_HOURS * 60 * 60 * 1000;
console.log(`Waiting for approve_${RUN_ID}...`);

while (Date.now() - start < timeoutMs) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();
    for (const upd of data.result || []) {
      offset = upd.update_id + 1;
      if (upd.callback_query) {
        const cb = upd.callback_query;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: cb.id })
        });
        if (cb.data === `approve_${RUN_ID}`) {
          console.log("APPROVED");
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: "Approved! Posting to Instagram..." })
          });
          process.exit(0);
        }
        if (cb.data === `reject_${RUN_ID}`) {
          console.log("REJECTED");
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: "Rejected. Will not post." })
          });
          process.exit(2);
        }
      }
      if (upd.message?.text?.startsWith("EDIT:")) {
        const newCaption = upd.message.text.replace("EDIT:", "").trim();
        const fs = await import('fs');
        fs.writeFileSync('output/caption.txt', newCaption);
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: `Caption updated to:\n${newCaption}\n\nNow tap Approve.` })
        });
      }
    }
  } catch (e) { console.error(e); }
  await new Promise(r => setTimeout(r, 3000));
}
console.log("TIMEOUT");
process.exit(1);
