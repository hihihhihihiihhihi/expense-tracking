import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/expense/server";
import type { Category, LineItem } from "@/lib/expense/types";

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

  const subtotals: Record<Category, number> = { transport: 0, entertainment: 0 };
  for (const item of (items ?? []) as LineItem[])
    subtotals[item.category] += Number(item.amount);
  subtotals.transport = Math.round(subtotals.transport * 100) / 100;
  subtotals.entertainment = Math.round(subtotals.entertainment * 100) / 100;
  const grand_total =
    Math.round((subtotals.transport + subtotals.entertainment) * 100) / 100;

  await writeAudit(supabase, "summary.generated", "summary", id, {
    item_count: items?.length ?? 0,
    grand_total,
  });

  return NextResponse.json({
    claim,
    items,
    subtotals,
    grand_total,
    item_count: items?.length ?? 0,
    generated_at: new Date().toISOString(),
  });
}
