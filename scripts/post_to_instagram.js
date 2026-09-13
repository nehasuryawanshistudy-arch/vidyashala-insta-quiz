import fs from 'fs';
const TOKEN = process.env.INSTAGRAM_GRAPH_TOKEN;
const IG_ID = process.env.INSTAGRAM_BUSINESS_ID;
const BASE = "https://graph.facebook.com/v21.0";
if (!TOKEN || !IG_ID) { console.error("Missing IG secrets"); process.exit(1); }
const videoPath = 'output/reel.mp4';
const caption = fs.readFileSync('output/caption.txt', 'utf-8');
console.log("Uploading Reel...");
let r = await fetch(`${BASE}/${IG_ID}/media?media_type=REELS&caption=${encodeURIComponent(caption)}&access_token=${TOKEN}`, { method: 'POST' });
let data = await r.json();
if (!data.id) { console.error("Init failed", data); process.exit(1); }
const containerId = data.id;
const uploadUrl = data.uri || data.video_upload_url;
console.log(`Container ${containerId}`);
const videoBuffer = fs.readFileSync(videoPath);
let uploadRes = await fetch(uploadUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'video/mp4', 'Authorization': `OAuth ${TOKEN}` },
  body: videoBuffer
});
if (!uploadRes.ok) { console.error(await uploadRes.text()); process.exit(1); }
console.log("Upload done, waiting 20s...");
await new Promise(r => setTimeout(r, 20000));
for (let i = 0; i < 10; i++) {
  let statusRes = await fetch(`${BASE}/${containerId}?fields=status_code&access_token=${TOKEN}`);
  let statusData = await statusRes.json();
  console.log(`Status: ${statusData.status_code}`);
  if (statusData.status_code === 'FINISHED') break;
  await new Promise(r => setTimeout(r, 10000));
}
r = await fetch(`${BASE}/${IG_ID}/media_publish?creation_id=${containerId}&access_token=${TOKEN}`, { method: 'POST' });
data = await r.json();
console.log("Published!", data);
