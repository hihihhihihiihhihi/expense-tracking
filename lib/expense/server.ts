import type { SupabaseClient } from "@supabase/supabase-js";

export async function recomputeClaimTotal(
  supabase: SupabaseClient,
  claimId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("line_items")
    .select("amount")
    .eq("claim_id", claimId);
  if (error) throw new Error(error.message);

  const total = (data ?? []).reduce(
    (sum: number, row: { amount: number }) => sum + Number(row.amount),
    0,
  );
  const rounded = Math.round(total * 100) / 100;

  const { error: updateError } = await supabase
    .from("expense_claims")
    .update({ grand_total: rounded })
    .eq("id", claimId);
  if (updateError) throw new Error(updateError.message);

  return rounded;
}

export async function writeAudit(
  supabase: SupabaseClient,
  action: string,
  entityType: "claim" | "line_item" | "summary",
  entityId: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("audit_logs").insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
  if (error) console.error(`audit write failed (${action}):`, error.message);
}
