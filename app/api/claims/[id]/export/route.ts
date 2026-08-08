import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/expense/server";
import { buildClaimCsv } from "@/lib/expense/csv";
import type { ExpenseClaim, LineItem } from "@/lib/expense/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claim } = await supabase
    .from("expense_claims")
    .select("*")
    .eq("id", id)
    .single();
  if (!claim)
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const { data: items, error } = await supabase
    .from("line_items")
    .select("*")
    .eq("claim_id", id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = buildClaimCsv(claim as ExpenseClaim, (items ?? []) as LineItem[]);
  const filename =
    (claim.title as string).replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "_") +
    "_claim.csv";

  await writeAudit(supabase, "claim.exported", "claim", id, {
    format: "csv",
    item_count: items?.length ?? 0,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
