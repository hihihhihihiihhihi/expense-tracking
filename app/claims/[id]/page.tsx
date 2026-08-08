import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseClaim, LineItem } from "@/lib/expense/types";
import ClaimDetail from "@/app/components/ClaimDetail";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claim } = await supabase
    .from("expense_claims")
    .select("*")
    .eq("id", id)
    .single();
  if (!claim) notFound();

  const { data: items } = await supabase
    .from("line_items")
    .select("*")
    .eq("claim_id", id)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-indigo-600"
      >
        ← All claims
      </Link>
      <ClaimDetail
        initialClaim={claim as ExpenseClaim}
        initialItems={(items ?? []) as LineItem[]}
      />
    </div>
  );
}
