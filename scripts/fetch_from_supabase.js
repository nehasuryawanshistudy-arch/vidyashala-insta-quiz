import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Polyfill WebSocket for Node 20
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WebSocket }
});

async function main() {
  fs.mkdirSync("output", { recursive: true });

  let { data: unused, error } = await supabase.from('questions').select('*').eq('used', false);
  if (error) { console.error(error); process.exit(1); }

  if (!unused || unused.length < 5) {
    console.log(`Only ${unused?.length || 0} left. Resetting all to unused...`);
    await supabase.from('questions').update({ used: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    const res = await supabase.from('questions').select('*').eq('used', false);
    unused = res.data;
  }

  if (!unused || unused.length === 0) {
    console.error("No questions in Supabase! Import questions first.");
    process.exit(1);
  }

  const shuffled = unused.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 5);

  console.log(`Selected ${selected.length} questions:`);
  selected.forEach(q => console.log(`- ${q.question_text}`));

  const esc = (t) => String(t || "").replace(/\|/g, " ").trim();
  const pipeLines = selected.map(q => `${esc(q.question_text)} | ${esc(q.option_a)} | ${esc(q.option_b)} | ${esc(q.option_c)} | ${esc(q.option_d)} | ${esc(q.correct_letter)} | ${esc(q.explanation)}`);
  const pipeText = pipeLines.join("\n");
  fs.writeFileSync("output/questions.txt", pipeText);

  const firstQ = selected[0].question_text;
  const caption = `Daily Banking Quiz! Can you get all 5 right?\n\nQ1: ${firstQ}\n\nComment your answer! 👇\n\nFollow @vidya.shala for daily quizzes\n#banking #ibps #sbi #quiz`;
  const title = `Can you get all 5 right? - ${new Date().toLocaleDateString('en-IN')}`;
  fs.writeFileSync("output/caption.txt", caption);
  fs.writeFileSync("output/title.txt", title);
  fs.writeFileSync("output/selected_ids.json", JSON.stringify(selected.map(s => s.id), null, 2));

  console.log("Wrote output/questions.txt, caption.txt, title.txt");
}

main();
