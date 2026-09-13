# Vidyashala Quiz Automation - From Scratch

This repo turns your browser-based Quiz Reel Factory into a daily auto-posting bot with Telegram approval.

## Files you already had
- quiz-reel-factory.html - your single-file factory (offline, no internet needed)

## What we added
- scripts/question_generator.js - generates 5 questions daily. Uses OpenAI if key set, else fallback banking questions.
- scripts/generate_reel.mjs - runs your factory headlessly using Playwright to export MP4
- scripts/notify_telegram.js - sends MP4 + title/caption to Telegram with Approve/Reject buttons
- scripts/wait_for_approval.js - pauses workflow for up to 2h waiting for your tap
- scripts/post_to_instagram.js - posts approved reel to Instagram Graph API

## Setup from ZERO

1. Create GitHub repo vidyashala-quiz-bot, upload this folder

2. Telegram Bot:
   - Chat @BotFather -> /newbot -> get BOT_TOKEN
   - Start bot, send hi
   - Open https://api.telegram.org/bot<BOT_TOKEN>/getUpdates to get CHAT_ID

3. Instagram:
   - Convert @vidya.shala to Business
   - Connect to Facebook Page
   - developers.facebook.com -> Create App -> Instagram Graph API product
   - Get IG Business ID and Long-lived Token

4. GitHub Secrets (Repo Settings -> Secrets):
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_CHAT_ID
   - INSTAGRAM_BUSINESS_ID
   - INSTAGRAM_GRAPH_TOKEN
   - OPENAI_API_KEY (optional)

5. Push to main. It will run daily 10 AM IST (4:30 UTC). Test via Actions -> Run workflow.

## Local Test
npm install
npx playwright install chromium
npm run generate:questions
npm run generate:reel
# Check output/reel.mp4
