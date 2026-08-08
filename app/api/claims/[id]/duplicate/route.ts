import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/expense/server";

type Params = { params: Promise<{ id: string }> };

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("expense_claims")
    .select("*")
    .eq("id", id)
    .single();
  if (!source)
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  // Shift the period forward by its own length (e.g. a week becomes next week)
  const lengthDays =
    Math.round(
      (Date.parse(source.period_end) - Date.parse(source.period_start)) / 86400000,
    ) + 1;
  const newStart = addDays(source.period_start, lengthDays);
  const newEnd = addDays(source.period_end, lengthDays);

  const newTitle = /^week of /i.test(source.title)
    ? `Week of ${new Date(newStart + "T00:00:00").toLocaleDateString("en-SG", { month: "short", day: "numeric", year: "numeric" })}`
    : `${source.title} (next period)`;

  const { data: claim, error } = await supabase
    .from("expense_claims")
    .insert({
      title: newTitle,
      period_start: newStart,
      period_end: newEnd,
      categories: source.categories,
      currency: source.currency,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAudit(supabase, "claim.duplicated", "claim", claim.id, {
    duplicated_from: id,
    period_start: newStart,
    period_end: newEnd,
  });

  return NextResponse.json({ claim }, { status: 201 });
}
