# Frontend — Recipe & Event Management Platform

React single-page application (SPA) for the Recipe & Event Management Platform. It provides the UI for authentication, recipes, events, recipe sharing, event invites, friends, notifications, and optional AI features (parse recipe/event from text, suggest recipes).

---

## How the frontend was built

### Tech stack

- **React 19** — UI library
- **TypeScript** — Typing and better DX
- **Vite 7** — Build tool and dev server (HMR, fast refresh)
- **React Router 6** — Client-side routing (e.g. `/dashboard/recipes`, `/dashboard/events`)
- **TanStack React Query v5** — Server state, caching, and request handling for API calls
- **react-icons** — Icon set for UI
- **ESLint** — Linting (with TypeScript and React rules)

No UI framework (e.g. MUI/Tailwind) is used; styling is done with plain CSS (e.g. `index.css` and component-level styles).

### Structure and patterns

- **API layer** — All backend communication goes through `src/api/`: a base `http.ts` with `apiRequest()`, JWT in `Authorization` header, and 401 handling (clear token, redirect to `/`). Feature modules: `auth.ts`, `users.ts`, `recipes.ts`, `events.ts`, `friends.ts`, `notifications.ts`, `shares.ts`, `ai.ts`; shared types in `types.ts`.
- **Routing** — `App.tsx` uses `createBrowserRouter`: public landing at `/`, dashboard layout at `/dashboard` with nested routes for recipes, events, shared recipes, invites, friends, notifications, settings. Catch-all redirects to `/`.
- **State** — Server state via React Query; auth token in `localStorage`; theme via `ThemeContext`.
- **Layout** — `DashboardLayout` wraps authenticated pages; pages live under `src/pages/`, reusable pieces under `src/components/` and `src/layouts/`.

### Project structure

```
frontend/
├── src/
│   ├── api/           # API client: http.ts, auth.ts, users.ts, recipes.ts, events.ts, etc.
│   ├── components/    # Reusable UI (modals, icons, etc.)
│   ├── contexts/      # React context (e.g. ThemeContext)
│   ├── hooks/         # Custom hooks (e.g. useMyAvatarUrl)
│   ├── layouts/       # DashboardLayout
│   ├── pages/         # Route-level pages (Landing, Recipes, Events, Settings, etc.)
│   ├── App.tsx        # Router setup
│   ├── main.tsx       # React root, QueryClient, ThemeProvider
│   └── index.css      # Global styles
├── index.html
├── package.json
├── vite.config.ts     # Dev server, /api proxy to backend
├── tsconfig.json
└── README.md          # This file
```

### Dev proxy

In development, requests to `/api/*` are proxied to the backend (default `http://127.0.0.1:8000`) so the app can call `/api/auth/login`, `/api/recipes`, etc. without CORS. Configure the target with `VITE_API_PROXY_TARGET` if your backend runs elsewhere.

---

## Prerequisites

- **Node.js** (LTS, e.g. 20+) and **npm**

---

## How to run

### 1. Install dependencies

From the `frontend/` directory:

```bash
cd frontend
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

- App: **http://localhost:5173**
- The backend must be running (e.g. `uvicorn app.main:app --reload` in `backend/`) so API calls succeed. If the backend is on a different host/port, set:

```bash
# Optional: only if backend is not at http://127.0.0.1:8000
set VITE_API_PROXY_TARGET=http://your-backend-host:port
npm run dev
```

### 3. Build for production

```bash
npm run build
```

Output is in `dist/`. Serve that folder with any static file server or CDN; the backend can be deployed separately.

### 4. Preview production build locally

```bash
npm run preview
```

---

## Scripts

| Script    | Command           | Description                    |
|-----------|-------------------|--------------------------------|
| `dev`     | `npm run dev`     | Start Vite dev server          |
| `build`   | `npm run build`   | TypeScript check + Vite build   |
| `preview` | `npm run preview` | Serve `dist/` locally          |
| `lint`    | `npm run lint`    | Run ESLint                     |

---

## Notes

- The app expects the backend at the proxy target; health check or API docs are at the backend URL (e.g. http://127.0.0.1:8000/docs when running locally).
- JWT is stored in `localStorage` under `access_token`; 401 responses clear it and redirect to `/`.
