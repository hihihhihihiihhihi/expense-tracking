## Tasks — Expense Tracking

### Sprint 1 — Database & Core Claim CRUD
**Goal**: Claim + line item CRUD works end-to-end against Postgres; demo seed data visible.
- [ ] Create Supabase project, run migration SQL
- [ ] Build `expense_claims` CRUD API routes
- [ ] Build `line_items` CRUD API routes (scoped to claim_id)
- [ ] Claim list page (shows existing claims, "New Claim" button)
- [ ] New claim form (title, period dates, categories)
- [ ] Claim detail page: line-item grid + add/edit/delete rows
- [ ] Server-side grand_total computation on save
- [ ] Seed 3 demo claims with line items
- **DoD**: Create a claim, add 5 line items, refresh — all data persists, totals correct.

### Sprint 2 — Summary Report & Export ← v1 FUNCTIONAL MILESTONE
**Goal**: One-pass workflow produces summary + downloadable file.
- [ ] Summary report view (itemized table + category subtotals + grand total)
- [ ] "Generate Summary" button renders report from stored rows
- [ ] CSV export endpoint + download button
- [ ] Rule-based vendor → category auto-tag on line-item save
- [ ] Loading / empty / error states on all views
- [ ] Audit log writes for create/edit/delete/finalize/export
- **DoD**: Given a week's receipts, user creates a claim, enters all items, clicks Generate Summary, downloads CSV — done in minutes. This is the success scenario.

### Sprint 3 — Polish & Recurring Templates (later)
**Goal**: Reduce friction further.
- [ ] Duplicate-claim-from-template button
- [ ] Inline vendor autocomplete from history
- [ ] Mobile-responsive line-item grid
- [ ] Confirmation dialogs for delete
- **DoD**: User can duplicate last week's claim with one click.

### Sprint 4 — Lock It Down (later, before real data)
**Goal**: Auth + per-user isolation.
- [ ] Add Supabase Auth (email/password)
- [ ] Signup/login pages
- [ ] Replace permissive RLS with `auth.uid() = user_id` policies
- [ ] Set `user_id` on all new rows from session
- [ ] Migrate existing demo rows to a real user
- **DoD**: Anonymous access blocked; only logged-in user sees own claims.

### Text Gantt
```
Sprint 1: DB + Claim CRUD          ████
Sprint 2: Summary + Export (v1)    ████
Sprint 3: Templates + Polish       ████
Sprint 4: Lock Down Auth           ████
```