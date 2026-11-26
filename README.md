# 33 Room frontend

React and Vite interface for monthly utility bills, resident selection, WhatsApp notices and payment tracking.

See [the project setup guide](../README.md) for the complete frontend/backend setup and WhatsApp configuration.

## Commands

- `npm run dev`: start the development server.
- `npm run lint`: run ESLint.
- `npm run build`: create the production bundle in `dist`.
- `npm run preview`: preview the production bundle.

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.

Set `VITE_API_URL=http://localhost:4000/api` in `.env` for local development. The value must point to the deployed backend before a production build. WhatsApp credentials belong only in the backend environment.

The interface supports first-admin setup, sign in/out, expired-session recovery, month selection, stay-date suggestions, explicit resident selection, exact share previews, stored message status, safe retries and cumulative payments.
