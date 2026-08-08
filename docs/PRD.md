## Expense Tracking — Product Requirements

### Problem
Every week, logging transport and entertainment claims takes 3 hours of manual paperwork. Delays in submitting claims cause late-fee charges and interest costs. This tool automates that workflow into a one-pass, minutes-long action.

### Target user
The builder (self). Currently a solo internal user.

### Core objects
- **ExpenseClaim** — one claim period; has category (transport/entertainment), period dates, status, totals.
- **LineItem** — one expense entry (date, vendor, category, amount, currency, purpose, receipt_status, image_url).
- **SummaryReport** — auto-generated summary of a claim period (itemized line items, category totals, grand total).

### MVP (v1) — checklist
- [ ] Create a new claim period
- [ ] Add multiple transport and entertainment line items in one pass
- [ ] Auto-calculate category subtotals and grand total
- [ ] Auto-generate a summary report (itemized + totals) viewable on screen
- [ ] Edit/delete line items; totals recompute live
- [ ] Export summary as CSV/PDF
- [ ] Demo seed data viewable without login

### Non-goals (v1)
- No Teams app
- No multi-user / shared teams
- No approvals workflow (single user)
- No OCR / receipt scanning intelligence

### Success criteria (concrete end-to-end scenario)
Given a stack of transport receipts and entertainment notes from the past week, the user creates one new claim, enters all line items in a single screen, and within minutes sees an auto-generated summary report with correct category subtotals, grand total, and a downloadable CSV — replacing the 3-hour manual process.