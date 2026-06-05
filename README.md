# 23bq1a6170 — Campus Notifications Frontend

A responsive React + TypeScript single-page application for campus notification management.

## Author

**23bq1a6170**

## Features

- **Dashboard** — Stats overview and 5 most recent notifications
- **All Notifications** — Paginated list with full expand/collapse detail view
- **Priority Inbox** — Auto-ranked by urgency score (recency + category + keywords)
- **Filter & Search** — Live search with category and priority filters
- **Viewed Tracking** — Read state persisted via `localStorage`
- **Responsive** — Sidebar layout on desktop, tab bar on mobile

## Running Locally

### Prerequisites

- Node.js v18+

### Install and start

```bash
npm install
npm run dev       # http://localhost:5173
```

### Build for production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

The `vercel.json` is already configured for client-side routing.

## Tech Stack

| Dependency | Purpose |
|---|---|
| React 18 | UI library |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| TanStack Router | File-based client-side routing |
| TanStack Query | Data fetching, caching, background sync |

## Project Structure

```
src/
  main.tsx                   — App entry point (QueryClient setup)
  styles.css                 — Global CSS variables and base styles
  routeTree.gen.ts           — Auto-generated route tree (do not edit)

  routes/
    __root.tsx               — Root layout with AppShell
    index.tsx                — Dashboard page
    notifications.tsx        — All notifications (paginated)
    priority.tsx             — Priority inbox
    filters.tsx              — Filter & search page

  components/
    AppShell.tsx             — Sidebar / navigation layout
    NotificationCard.tsx     — Single notification card component

  lib/
    notificationApi.ts       — API client + mock data + TypeScript types
    priorityCalculator.ts    — Urgency scoring algorithm
    viewedStorage.ts         — localStorage read-state helpers
```

## Priority Scoring Algorithm

Each notification receives a numeric urgency score:

| Signal | Condition | Points |
|---|---|---|
| Base priority | `high` | +100 |
| Base priority | `medium` | +50 |
| Base priority | `low` | +10 |
| Category | `emergency` | +80 |
| Category | `academic` | +30 |
| Recency | < 2 hours old | +40 |
| Recency | < 6 hours old | +20 |
| Keywords | per urgent keyword matched | +15 |

Urgent keywords: `urgent`, `deadline`, `final`, `emergency`, `important`
