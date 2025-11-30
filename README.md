# RoomFlux

Product design exploration workspace that scrapes property imagery, lets you iterate on views with Flux-powered edits, and keeps your chat, assets, and generations in sync. The repo ships with a FastAPI backend plus a Vite/React frontend.

## Project structure

```
backend/      # FastAPI application, Supabase + Flux integrations
frontend/     # Vite + React SPA for the design explorer UI
deckd-api/    # Local Python virtual environment (optional convenience)
```

## Requirements

- Python 3.12 (recommended)
- Node.js 20 LTS + npm 10
- Supabase project (tables: `sessions`, `views`, `asset_library`).
- Flux/BFL API credentials and Apify token for scraping.

## Backend setup

1. **Install dependencies**
   ```bash
   cd backend
   python3 -m venv ../deckd-api  # optional if you do not want to reuse the provided venv
   source ../deckd-api/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment variables**
   Create `backend/.env` with the following keys:
   ```env
   BFL_API_KEY=...
   FLUX_API_URL=https://api.bfl.ai/v1/flux-kontext-pro
   SUPABASE_URL=...
   SUPABASE_KEY=...
   APIFY_CLIENT_TOKEN=...
   APIFY_ACTOR_ID=...
   ```
   The defaults shown above already match the values referenced in `app/core/config.py`; override as needed.

3. **Run the API**
   ```bash
   uvicorn app.main:app --reload
   ```
   The server exposes routes under `http://localhost:8000/api/v1` and enables CORS for the Vite dev server.

## Frontend setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment variables**
   Create `frontend/.env` (or `.env.local`) and point the app at your API:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Running the full stack

1. Start the FastAPI server (step above).
2. Start the Vite dev server. It will proxy requests to the API base URL supplied via `VITE_API_BASE_URL`.
3. Navigate to `http://localhost:5173` to scrape listings, edit views, manage assets, and chat.

## Useful scripts

- `npm run build` (frontend) – generate a production build via Vite.
- `uvicorn app.main:app --reload` (backend) – restart-on-change API server.

## Troubleshooting

- **CORS errors** – ensure the backend is running on `localhost:8000` and that `VITE_API_BASE_URL` matches. The FastAPI CORS middleware only trusts `http://localhost:5173` / `127.0.0.1:5173` by default.
- **Supabase auth errors** – verify `SUPABASE_URL` and `SUPABASE_KEY` correspond to a service role key so the API can insert/update rows.
- **Flux generation failures** – confirm `BFL_API_KEY` is valid and the remote service is reachable; the backend logs will print any upstream error payloads.
