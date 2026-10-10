# Money Ledger

A private, single-user ledger for every rupee that comes in and goes out, with daily, monthly and yearly reports you can trust. Built to the Money Ledger PRD v1.0.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no configuration the app runs in **local mode**: data is stored in this browser's IndexedDB. Download a backup from Settings before clearing browser data.

## Turn on cloud sync

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor. It creates the tables, row-level security policies and the restore and account-deletion functions.
2. In Supabase, Authentication → URL configuration, add `http://localhost:3000/auth/callback` (and your production URL) to the redirect list.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Restart the dev server. The app now requires sign-in (password or email link) and syncs per user.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests for money math, totals, running balance, year summary, CSV and backup validation |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

## How it is built

- **Next.js 16, React 19, TypeScript, Tailwind v4.** All colours, sizes, spacing and radii are design tokens in `src/app/globals.css`, with light and dark values.
- **Money is integer paise.** Parsing and formatting live in `src/lib/money.ts`. Display uses Indian grouping (₹1,25,000.00) and a true minus sign.
- **Totals are derived, never stored.** `src/lib/calc.ts` computes balance, monthly totals, running balance, year summary and category breakdowns from the entry list, and is covered by tests.
- **Storage is an interface** (`src/lib/store/types.ts`) with two implementations: IndexedDB (`local.ts`) and Supabase (`supabase.ts`). Writes resolve only after the data is durable, then the UI updates.
- **Charts** use Recharts with a table view on every chart, so figures are never colour-only.
- **Exports**: CSV for entries and reports, PDF for a month and for the monthly or year report. PDFs use "INR" instead of the ₹ glyph, which the built-in PDF fonts lack. Numbers are identical to the screen.

## Where things are

```
src/app/(app)/            Home, Entries, Reports, Reports/[month], Settings
src/app/login             Sign-in (cloud mode only)
src/app/auth/callback     Email-link exchange
src/components/ui         Button, inputs, segmented control, chips, sheet, toast, tabs, table, skeletons
src/components/ledger     Entry form and list, stat tiles, charts, category breakdown
src/components/providers  Theme, toast, ledger state, quick-add sheet
src/lib                   Money, dates, calculations, CSV, PDF, backup, store adapters
supabase/schema.sql       Tables, RLS policies, functions
```

## Not in v1 (per PRD)

Recurring entries, budgets, savings goals, attachments, offline queueing, multi-account, year-in-review and app lock are Phase 2 and 3.
