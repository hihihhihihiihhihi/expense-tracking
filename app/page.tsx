import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, formatDate } from "@/lib/expense/format";
import type { ExpenseClaim } from "@/lib/expense/types";
import NewClaimForm from "./components/NewClaimForm";

export const dynamic = "force-dynamic";

type ClaimRow = ExpenseClaim & { line_items: { count: number }[] };

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_claims")
    .select("*, line_items(count)")
    .order("period_start", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load claims: {error.message}
      </div>
    );
  }

  const claims = (data ?? []) as ClaimRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Claims</h1>
          <p className="text-sm text-neutral-500 mt-1">
            One claim per period — enter items, generate a summary, export.
          </p>
        </div>
      </div>

      <NewClaimForm />

      {claims.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          No claims yet. Create your first claim above to get started.
        </div>
      ) : (
        <ul className="grid gap-3">
          {claims.map((claim) => {
            const itemCount = claim.line_items?.[0]?.count ?? 0;
            return (
              <li key={claim.id}>
                <Link
                  href={`/claims/${claim.id}`}
                  className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{claim.title}</span>
                        <StatusBadge status={claim.status} />
                      </div>
                      <div className="text-sm text-neutral-500 mt-0.5">
                        {formatDate(claim.period_start)} – {formatDate(claim.period_end)}
                        <span className="mx-2 text-neutral-300">·</span>
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold tabular-nums">
                        {formatMoney(Number(claim.grand_total), claim.currency)}
                      </div>
                      <div className="text-xs text-neutral-400">grand total</div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "finalized" ? (
    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
      Finalized
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
      Draft
    </span>
  );
}
