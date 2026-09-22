# Project notes

## Run locally

The application uses the existing Node.js/Express + Vite setup:

```bash
PORT=5000 pnpm dev
```

The Replit workflow is configured to run this command on port 5000.

## Telegram order notifications

Order notifications are sent by the server through Telegram. These environment
variables must be present:

- `TELEGRAM_BOT_TOKEN` — stored as a Replit Secret
- `TELEGRAM_CHAT_ID` — the Telegram group or chat receiving order notifications

After changing either value, restart the `Start application` workflow.