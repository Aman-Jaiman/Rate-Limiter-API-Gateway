# RateGuard frontend

A React + Vite live client for the Rate Limiter API.

## Setup

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set `VITE_API_URL` in `.env.local` to the backend origin (for this repository's local configuration: `http://localhost:3001`). The Vite development server defaults to `http://localhost:5173`.

Create a free demo API key from the page or enter an existing key. Requests are sent to the real `GET /api/test` endpoint. The UI reads the API response and rate-limit headers; it does not simulate request outcomes.

## Production build

```bash
npm run build
npm run preview
```
