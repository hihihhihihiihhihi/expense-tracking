import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recomputeClaimTotal, writeAudit } from "@/lib/expense/server";
import { autoTagVendor } from "@/lib/expense/autoTag";

type Params = { params: Promise<{ id: string }> };

const CATEGORIES = ["transport", "entertainment"];
const RECEIPT_STATUSES = ["none", "attached", "lost"];

export async function POST(request: NextRequest, { params }: Params) {
  const { id: claimId } = await params;
  const body = await request.json();
  const { date, vendor, category, amount, purpose, receipt_status } = body;

  if (!date || !vendor?.trim() || !category || amount == null) {
    return NextResponse.json(
      { error: "date, vendor, category and amount are required" },
      { status: 400 },
    );
  }
  if (!CATEGORIES.includes(category))
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount < 0)
    return NextResponse.json({ error: "Amount must be a non-negative number" }, { status: 400 });
  if (receipt_status && !RECEIPT_STATUSES.includes(receipt_status))
    return NextResponse.json({ error: "Invalid receipt_status" }, { status: 400 });

  const supabase = await createClient();

  const { data: claim } = await supabase
    .from("expense_claims")
    .select("id, status, currency")
    .eq("id", claimId)
    .single();
  if (!claim)
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  if (claim.status === "finalized")
    return NextResponse.json(
      { error: "Claim is finalized. Revert to draft to add items." },
      { status: 409 },
    );

  const { data: item, error } = await supabase
    .from("line_items")
    .insert({
      claim_id: claimId,
      date,
      vendor: vendor.trim(),
      category,
      amount: Math.round(numAmount * 100) / 100,
      currency: claim.currency,
      purpose: purpose?.trim() || "",
      receipt_status: receipt_status || "none",
      ...autoTagVendor(vendor, category),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grand_total = await recomputeClaimTotal(supabase, claimId);
  await writeAudit(supabase, "line_item.created", "line_item", item.id, {
    claim_id: claimId,
    vendor: item.vendor,
    amount: item.amount,
  });

  return NextResponse.json({ item, grand_total }, { status: 201 });
}
