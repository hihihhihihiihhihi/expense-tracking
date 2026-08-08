create table if not exists expense_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  period_start date not null,
  period_end date not null,
  categories text[] not null default '{transport,entertainment}',
  currency text not null default 'SGD',
  status text not null default 'draft' check (status in ('draft','finalized')),
  grand_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
alter table expense_claims enable row level security;
drop policy if exists "expense_claims_v1_read" on expense_claims;
create policy "expense_claims_v1_read" on expense_claims for select using (true);
drop policy if exists "expense_claims_v1_write" on expense_claims;
create policy "expense_claims_v1_write" on expense_claims for all using (true) with check (true);

create table if not exists line_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references expense_claims(id) on delete cascade,
  user_id uuid,
  date date not null,
  vendor text not null,
  category text not null check (category in ('transport','entertainment')),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'SGD',
  purpose text default '',
  receipt_status text not null default 'none' check (receipt_status in ('none','attached','lost')),
  ai_category_tag text,
  ai_category_source text,
  ai_category_confidence numeric,
  ai_category_review text default 'unreviewed',
  created_at timestamptz not null default now()
);
alter table line_items enable row level security;
drop policy if exists "line_items_v1_read" on line_items;
create policy "line_items_v1_read" on line_items for select using (true);
drop policy if exists "line_items_v1_write" on line_items;
create policy "line_items_v1_write" on line_items for all using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
drop policy if exists "audit_logs_v1_read" on audit_logs;
create policy "audit_logs_v1_read" on audit_logs for select using (true);
drop policy if exists "audit_logs_v1_write" on audit_logs;
create policy "audit_logs_v1_write" on audit_logs for all using (true) with check (true);

insert into expense_claims (id, title, period_start, period_end, categories, currency, status, grand_total) values
  ('a1111111-1111-1111-1111-111111111111', 'Week of Jan 6, 2025', '2025-01-06', '2025-01-12', '{transport,entertainment}', 'SGD', 'finalized', 284.50),
  ('a2222222-2222-2222-2222-222222222222', 'Week of Jan 13, 2025', '2025-01-13', '2025-01-19', '{transport,entertainment}', 'SGD', 'finalized', 156.20),
  ('a3333333-3333-3333-3333-333333333333', 'Week of Jan 20, 2025', '2025-01-20', '2025-01-26', '{transport,entertainment}', 'SGD', 'draft', 0)
on conflict (id) do nothing;

insert into line_items (claim_id, date, vendor, category, amount, currency, purpose, receipt_status) values
  ('a1111111-1111-1111-1111-111111111111', '2025-01-06', 'Grab', 'transport', 18.50, 'SGD', 'Client meeting commute', 'attached'),
  ('a1111111-1111-1111-1111-111111111111', '2025-01-07', 'SMRT', 'transport', 2.40, 'SGD', 'Office travel', 'none'),
  ('a1111111-1111-1111-1111-111111111111', '2025-01-08', 'GrabFood', 'entertainment', 45.20, 'SGD', 'Team lunch', 'attached'),
  ('a1111111-1111-1111-1111-111111111111', '2025-01-09', 'Klook', 'entertainment', 52.00, 'SGD', 'Client entertainment event', 'attached'),
  ('a1111111-1111-1111-1111-111111111111', '2025-01-10', 'ComfortDelGro', 'transport', 166.40, 'SGD', 'Airport drop-off for business trip', 'attached'),
  ('a2222222-2222-2222-2222-222222222222', '2025-01-13', 'Grab', 'transport', 22.10, 'SGD', 'Client visit', 'attached'),
  ('a2222222-2222-2222-2222-222222222222', '2025-01-14', 'Netflix', 'entertainment', 17.98, 'SGD', 'Team movie night', 'none'),
  ('a2222222-2222-2222-2222-222222222222', '2025-01-15', 'SBS', 'transport', 1.90, 'SGD', 'Daily commute', 'none'),
  ('a2222222-2222-2222-2222-222222222222', '2025-01-16', 'GrabFood', 'entertainment', 38.20, 'SGD', 'Client dinner', 'attached'),
  ('a2222222-2222-2222-2222-222222222222', '2025-01-17', 'Grab', 'transport', 76.02, 'SGD', 'Multiple trips for site visit', 'attached')
on conflict (id) do nothing;

insert into audit_logs (action, entity_type, entity_id, details) values
  ('claim.finalized', 'claim', 'a1111111-1111-1111-1111-111111111111', '{"grand_total": 284.50}'),
  ('claim.finalized', 'claim', 'a2222222-2222-2222-2222-222222222222', '{"grand_total": 156.20}')
on conflict (id) do nothing;