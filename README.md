# SpaceMatch Hub - frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Redux Toolkit (RTK Query) + lucide icons.
The API is the FastAPI backend in `../backend`.

## Run locally

```bash
# 1. backend (in ../backend)
uvicorn app.main:app --reload            # http://127.0.0.1:8000

# 2. frontend
cp .env.example .env.local               # BACKEND_URL=http://127.0.0.1:8000
npm install
npm run dev                              # http://localhost:3000
```

Set `BASE_URL=http://localhost:3000` in `backend/.env` so links in emails (invites, password resets) open this app.

## How it talks to the backend

- The browser only calls this app. `next.config.ts` rewrites `/api/*` to `BACKEND_URL`, so the backend's
  session cookie is first-party and no CORS is needed. **Rewrites are fixed at build time**: set `BACKEND_URL`
  before `npm run build`.
- All API calls live in `src/store/api.ts` (RTK Query). It sends the session's CSRF token on every
  state-changing request (refreshing it once if it expired), turns errors into readable messages, and marks the
  user signed out on a 401.
- `src/store/auth-slice.ts` holds the signed-in user and CSRF token (loaded from `GET /api/me`).
- The Redux store exists only in the browser (`src/store/provider.tsx`); the server sends a loading screen.

## Layout

```
src/
  app/
    (auth)/        logged-out pages (centered card): login, signup, forgot-password,
                   reset-password/[token], recover, invite/[token]
    (app)/         signed-in pages (sidebar): properties, properties/[id], brokers, api-keys, account
  components/
    layout/        app shell + route guards, nav, breadcrumbs, log out
    ui/            Button, Field/Input/Select/PasswordInput/CodeInput, Tag, Modal, Toast, PlatformIcon, skeletons
    auth/ properties/ brokers/ api-keys/ account/   page components
  store/           Redux store, auth slice, RTK Query API
  lib/             response types, formatting helpers
```

Route guards: signed-in pages send signed-out visitors to `/login?next=…`; agent-only pages (Brokers, API keys)
send brokers to Properties; login/sign-up send signed-in users into the app. Invite, reset and recover links work
either way.

## Deploy on Vercel

1. Deploy the backend first (see `backend/README.md` → Vercel) with `BASE_URL=https://spacematch-frontend.vercel.app`.
2. In this project: Settings → Environment Variables → `BACKEND_URL` = the backend's production URL
   (e.g. `https://spacematch-backend.vercel.app`, no trailing slash) for Production (and Preview if you use it).
3. Redeploy. The `/api` proxy target is fixed at build time; without `BACKEND_URL` the Vercel build stops with
   "Set BACKEND_URL …" instead of shipping a frontend that calls 127.0.0.1.
4. Check `https://spacematch-frontend.vercel.app/api/me` returns JSON (`{"user":null,"csrf":…}`).

## Production (other hosts)

```bash
BACKEND_URL=https://your-backend.example.com npm run build
npm start                                 # PORT=3000 by default
```

- Backend `.env`: `BASE_URL` = this app's public URL (emailed links, and secure cookies when it is https).
- Put both behind one domain if you can (e.g. Caddy: `/api/*` → backend, everything else → this app). Either
  way the browser only ever sees this app's domain.
- If a proxy sits in front of this app, it should set `X-Forwarded-For`; the backend's rate limits use it.

## Notes for this Next.js version

- `cacheComponents` is on: anything reading the URL on the client (`useSearchParams`, `usePathname`, dynamic
  `params`) renders inside `<Suspense>`, or `npm run build` fails.
- Previous pages stay mounted (hidden) after navigation to keep their state - remember this when writing
  browser tests (match visible elements only).
