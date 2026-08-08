"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DuplicateClaimButton({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function duplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      router.push(`/claims/${data.claim.id}`);
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={duplicate}
      disabled={busy}
      title="Create next period's claim with the same setup"
      className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
    >
      {busy ? "Duplicating…" : "Duplicate"}
    </button>
  );
}
