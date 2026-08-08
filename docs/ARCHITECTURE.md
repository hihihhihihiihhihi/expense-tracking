## Architecture — Expense Tracking

### Stack
- **Next.js** (App Router, TypeScript) — frontend + API routes
- **Supabase** (Postgres) — database, storage for receipts
- **Vercel** — deploy

### Build now (v1)
- Claim CRUD + line-item entry grid
- Live subtotal/total calculation (client-side + server-confirmed on save)
- Summary report view (auto-generated from line items)
- CSV export
- Demo seed data, no login required

### Build later
- Receipt image upload (Supabase Storage)
- Tax/GST auto-split per line item
- Weekly recurring claim templates
- Lock-down: auth + per-user RLS

### Key user action — step-by-step flow
1. User opens app → sees list of existing claims + "New Claim" button
2. Creates a claim (period name, start/end dates, category mix)
3. On the claim page, enters line items in a grid (date, vendor, category, amount, purpose)
4. As each row is added, subtotals + grand total update live
5. User clicks "Generate Summary" → summary report renders (itemized + totals)
6. User clicks "Export CSV" → downloads file
7. All rows persist to Postgres; refresh keeps state

### Layer plan
1. **Data layer**: Postgres tables for claims, line items, summaries; RLS open for demo.
2. **App logic**: CRUD APIs, server-side total computation, summary aggregation.
3. **Smart features (later)**: auto-categorize vendors, flag missing receipts, suggest period templates.

### Why core runs without AI
Totals, summaries, and exports are pure arithmetic over stored rows. No AI needed for the weekly workflow to complete. AI features are additive (auto-tagging) and layered above a working core.