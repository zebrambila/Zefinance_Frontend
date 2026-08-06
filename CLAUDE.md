# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ZeFinance — a React + Vite front end for a personal investment portfolio tracker (patrimônio, ativos, dividendos, transações). UI text and domain terms are in Brazilian Portuguese. It is a client for a separate .NET backend API (`InvestmentPortfolio.Api`, typically at a sibling repo `../InvestmentPortfolio`) — this repo has no server code of its own.

## Commands

```bash
npm run dev      # dev server with HMR, http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # eslint .
```

There is no test suite configured in this repo.

## Backend integration

- The app talks to the API via `src/api/client.js`, a thin `fetch` wrapper. Base URL is `VITE_API_BASE_URL` (see `.env.example`), defaulting to `https://localhost:7220` to match the API's local `launchSettings.json`.
- All requests go to `{BASE_URL}/v1/{path}`. Responses are unwrapped `Response<T>` / `PagedResponse<T>` envelopes; `client.js` throws if `res.ok` is false or the payload has `isSuccess: false`.
- Each `src/api/*.js` file mirrors one backend `Endpoints/{Resource}/*` folder and documents, in comments, the exact route, request body shape, and response shape (including field-name quirks like the API's `type` request field vs. `side` response field, or `assetId` vs `id`). When adding or changing an API call, check the corresponding comment first — these were written from the actual backend source and are the closest thing to a contract this repo has.
- Domain enums (`EAssetType`, `EOperationType`, `ECustodian`) are defined next to their API module and serialized as strings by the backend (global `JsonStringEnumConverter`) — use these constants rather than hardcoding literals.
- `src/data/mock.js` is **not** the data source anymore — real data comes from the API. Only its formatting/color helpers (e.g. `initialOf`) are still imported by pages.

## Architecture

- **No router.** `App.jsx` holds a `page` string in `useState` and conditionally renders one of `src/pages/*`. Sidebar navigation just calls `setPage`.
- **Modals are orchestrated centrally.** `App.jsx` holds `modalKind` (`'transaction' | 'asset' | 'dividend' | null`) and renders the matching modal from `src/modals/`. A modal's `onSubmit` calls back into `App.jsx` to close itself, bump a page-specific `refreshKey` (so the target page re-fetches), switch pages, and fire the shared `Toast`.
- **Filters live in `App.jsx`, not the pages.** `period` (`'1M'|'3M'|'6M'|'12M'|'YTD'|null`) and `month` (`'YYYY-MM'|null`) are mutually exclusive top-bar filters passed down as props; `Topbar` renders the filter UI itself (`showPeriodFilters` hides it on dashboard/configurações).
- **Data fetching is per-page**, using `useEffect` + local `useState` (loading/error/data), with a `cancelled` flag guard against races — there's no shared query cache or global state library. Look at `src/pages/Ativos.jsx` or `Dashboard.jsx` as the reference pattern before adding a new fetch.
- **Pagination** is server-side (`pageNumber`/`pageSize`/`totalPages`/`totalCount` from the API), rendered via the shared `src/components/Pagination.jsx`.
- **Import flows**: `src/modals/Import{Assets,Dividends,Transactions}Modal.jsx` handle CSV bulk import against the `BulkCreate*` endpoints.
- **Styling is 100% inline** (`style={{...}}`) — no CSS Modules, no Tailwind, no styled-components. `src/index.css` only has reset/fonts/scrollbar. Shared modal styling helpers live in `src/components/modalStyles.js` and `ModalShell.jsx` (`Label`, `CancelButton`, `SubmitButton`). Match this convention rather than introducing a new styling approach.
- **Palette**: dark trading UI — canvas `#0b0e11`, surface `#1e2329`, ruler/border `#2b3139`, muted text `#707a8a`; `#FCD535` (yellow) is the single accent; `#0ecb81` positive / `#f6465d` negative for P&L. Fonts: Inter (UI) and JetBrains Mono (all numeric/tabular values), loaded via Google Fonts in `index.html`.
- **Charts are hand-rolled**, not a charting library: bar charts are `div`s with percentage heights, donut charts use CSS `conic-gradient`. Hover state for tooltips is plain `useState` index tracking (see `Dashboard.jsx`).
- **Formatting helpers** (`src/lib/format.js`): `fmtBRL`, `fmtNum`, `fmtPct`, `fmtKShort` (compact `Rk` chart-axis format), `parseNum`, `parseDateFlexible` (accepts `YYYY-MM-DD` or `DD/MM/YYYY`). Use these instead of ad hoc `Intl`/string formatting.
