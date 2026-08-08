## Agentic Layer — Expense Tracking

### Risk levels

#### Low (auto)
- **Auto-tag category** from vendor name on line-item create.
- **Auto-compute totals** on claim save/finalize.
- **Auto-generate summary** report from stored line items.

#### Medium (light approval)
- **Draft claim period** from recurring template (suggest dates + category mix; user confirms).
- **Update claim status** to `finalized` (user clicks button).

#### High (always approval)
- **Export CSV/PDF** — user-triggered; system generates file on click.
- **Submit claim externally** (later — not v1).

#### Critical (human-only)
- **Delete entire claim** — confirm dialog, no agent auto-delete.
- **Delete line item** — confirm dialog.
- **Edit finalized claim** — blocked unless reverted to draft by user.

### Named tools
- `auto_tag_vendor` (read line item, write ai_category_tag fields)
- `compute_claim_totals` (read line items, write expense_claims.grand_total)
- `generate_summary` (read claim + line items, return structured summary)
- `export_claim_csv` (read claim + line items, return file blob)

### Audit-log fields
| field | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid nullable | |
| action | text | tool name or user action |
| entity_type | text | 'claim' \| 'line_item' \| 'summary' |
| entity_id | uuid | |
| details | jsonb | payload snapshot |
| created_at | timestamptz | |

### v1 vs later
- **v1**: auto-tag, compute totals, generate summary, export CSV — all low-risk auto or user-triggered.
- **Later**: recurring claim drafts, external submission, amount anomaly alerts.