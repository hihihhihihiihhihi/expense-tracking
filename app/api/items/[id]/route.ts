import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recomputeClaimTotal, writeAudit } from "@/lib/expense/server";

type Params = { params: Promise<{ id: string }> };

const CATEGORIES = ["transport", "entertainment"];
const RECEIPT_STATUSES = ["none", "attached", "lost"];

async function getItemWithClaim(id: string) {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("line_items")
    .select("*, expense_claims(status)")
    .eq("id", id)
    .single();
  return { supabase, item };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { supabase, item } = await getItemWithClaim(id);

  if (!item)
    return NextResponse.json({ error: "Line item not found" }, { status: 404 });
  if (item.expense_claims?.status === "finalized")
    return NextResponse.json(
      { error: "Claim is finalized. Revert to draft to edit items." },
      { status: 409 },
    );

  const patch: Record<string, unknown> = {};
  for (const key of ["date", "vendor", "category", "amount", "purpose", "receipt_status"])
    if (key in body) patch[key] = body[key];

  if ("vendor" in patch && !(patch.vendor as string)?.trim())
    return NextResponse.json({ error: "Vendor cannot be empty" }, { status: 400 });
  if ("category" in patch && !CATEGORIES.includes(patch.category as string))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  if ("amount" in patch) {
    const num = Number(patch.amount);
    if (!Number.isFinite(num) || num < 0)
      return NextResponse.json({ error: "Amount must be a non-negative number" }, { status: 400 });
    patch.amount = Math.round(num * 100) / 100;
  }
  if ("receipt_status" in patch && !RECEIPT_STATUSES.includes(patch.receipt_status as string))
    return NextResponse.json({ error: "Invalid receipt_status" }, { status: 400 });
  if ("vendor" in patch) patch.vendor = (patch.vendor as string).trim();

  const { data: updated, error } = await supabase
    .from("line_items")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grand_total = await recomputeClaimTotal(supabase, item.claim_id);
  await writeAudit(supabase, "line_item.updated", "line_item", id, patch);

  return NextResponse.json({ item: updated, grand_total });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { supabase, item } = await getItemWithClaim(id);

  if (!item)
    return NextResponse.json({ error: "Line item not found" }, { status: 404 });
  if (item.expense_claims?.status === "finalized")
    return NextResponse.json(
      { error: "Claim is finalized. Revert to draft to delete items." },
      { status: 409 },
    );

  const { error } = await supabase.from("line_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grand_total = await recomputeClaimTotal(supabase, item.claim_id);
  await writeAudit(supabase, "line_item.deleted", "line_item", id, {
    claim_id: item.claim_id,
    vendor: item.vendor,
    amount: item.amount,
  });

  return NextResponse.json({ ok: true, grand_total });
}
