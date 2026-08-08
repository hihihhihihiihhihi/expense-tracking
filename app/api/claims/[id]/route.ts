import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/expense/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claim, error } = await supabase
    .from("expense_claims")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !claim)
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const { data: items, error: itemsError } = await supabase
    .from("line_items")
    .select("*")
    .eq("claim_id", id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 });

  return NextResponse.json({ claim, items });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("expense_claims")
    .select("id, status")
    .eq("id", id)
    .single();
  if (!existing)
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const allowed = ["title", "period_start", "period_end", "categories", "currency", "status"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) patch[key] = body[key];

  if (patch.status && !["draft", "finalized"].includes(patch.status as string)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Finalized claims are read-only except for reverting to draft
  if (existing.status === "finalized" && patch.status !== "draft") {
    const nonStatusKeys = Object.keys(patch).filter((k) => k !== "status");
    if (nonStatusKeys.length > 0 || !patch.status) {
      return NextResponse.json(
        { error: "Claim is finalized. Revert to draft to edit." },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from("expense_claims")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const action =
    patch.status === "finalized"
      ? "claim.finalized"
      : patch.status === "draft" && existing.status === "finalized"
        ? "claim.reverted_to_draft"
        : "claim.updated";
  await writeAudit(supabase, action, "claim", id, patch);

  return NextResponse.json({ claim: data });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("expense_claims")
    .select("id, title")
    .eq("id", id)
    .single();
  if (!existing)
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const { error } = await supabase.from("expense_claims").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(supabase, "claim.deleted", "claim", id, { title: existing.title });
  return NextResponse.json({ ok: true });
}
