import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/expense/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_claims")
    .select("*")
    .order("period_start", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, period_start, period_end, categories, currency } = body;

  if (!title?.trim() || !period_start || !period_end) {
    return NextResponse.json(
      { error: "title, period_start and period_end are required" },
      { status: 400 },
    );
  }
  if (period_end < period_start) {
    return NextResponse.json(
      { error: "period_end must be on or after period_start" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_claims")
    .insert({
      title: title.trim(),
      period_start,
      period_end,
      categories: categories?.length ? categories : ["transport", "entertainment"],
      currency: currency || "SGD",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(supabase, "claim.created", "claim", data.id, {
    title: data.title,
    period_start: data.period_start,
    period_end: data.period_end,
  });
  return NextResponse.json({ claim: data }, { status: 201 });
}
