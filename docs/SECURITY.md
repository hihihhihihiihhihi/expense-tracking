## Security — Expense Tracking

### Secret handling
- Supabase URL + anon key: public-safe, exposed via `NEXT_PUBLIC_` env vars.
- Supabase service role key: **server only**, never in frontend. Used in API routes for trusted operations.
- No other secrets in v1.

### Permission model
- **v1 (demo)**: RLS enabled but permissive — anon can read/write all demo rows. Intended for solo builder use.
- **Lock-down (later)**: `auth.uid() = user_id` on all tables. Only owner sees/edits own claims.
- No admin/role concept needed (single user).

### Approved-tools rule
- Only named tools execute server-side (auto_tag, compute_totals, generate_summary, export_csv).
- No raw SQL passthrough from frontend; all writes go through typed API routes or Supabase client with RLS.
- No arbitrary command execution anywhere.

### Audit principle
- Every meaningful action (create/edit/delete claim, create/edit/delete line item, finalize, export) writes to `audit_logs` with entity ref + payload snapshot + timestamp.
- Audit logs survive refresh and are server-stored.