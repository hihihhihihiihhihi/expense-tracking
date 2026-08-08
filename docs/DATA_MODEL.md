## Data Model — Expense Tracking

### `expense_claims`
| field | type | notes |
|---|---|---|
| id | uuid pk | |
| user_id | uuid nullable | owner scoping later |
| title | text | e.g. "Week of Jan 6" |
| period_start | date | |
| period_end | date | |
| categories | text[] | subset: ['transport','entertainment'] |
| currency | text | default 'SGD' |
| status | text | 'draft' \| 'finalized' |
| grand_total | numeric(12,2) | server-computed |
| created_at | timestamptz | |

### `line_items`
| field | type | notes |
|---|---|---|
| id | uuid pk | |
| claim_id | uuid | fk → expense_claims.id |
| user_id | uuid nullable | owner scoping later |
| date | date | |
| vendor | text | |
| category | text | 'transport' \| 'entertainment' |
| amount | numeric(12,2) | |
| currency | text | default 'SGD' |
| purpose | text | business purpose |
| receipt_status | text | 'none' \| 'attached' \| 'lost' |
| ai_category_tag | text | AI field — value |
| ai_category_source | text | AI field — source |
| ai_category_confidence | numeric | AI field — 0..1 |
| ai_category_review | text | default 'unreviewed' |
| created_at | timestamptz | |

### Relationships
- `expense_claims` 1→N `line_items` (cascade delete).

### RLS / permissions (v1 — demo open)
- All tables: permissive select/insert/update/delete for anon (demo).
- Later: `auth.uid() = user_id` on all tables.

### Server-derived truth
- `grand_total` on `expense_claims` is computed server-side from `line_items.amount`; survives refresh.