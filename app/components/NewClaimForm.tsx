"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { todayISO } from "@/lib/expense/format";

export default function NewClaimForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState(todayISO());
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [transport, setTransport] = useState(true);
  const [entertainment, setEntertainment] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const categories = [
      ...(transport ? ["transport"] : []),
      ...(entertainment ? ["entertainment"] : []),
    ];
    if (categories.length === 0) {
      setError("Select at least one category.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          period_start: periodStart,
          period_end: periodEnd,
          categories,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create claim");
      router.push(`/claims/${data.claim.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create claim");
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2.5 font-medium hover:bg-indigo-700 transition"
      >
        <span className="text-lg leading-none">+</span> New Claim
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-indigo-200 bg-white p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">New Claim</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-400 hover:text-neutral-600"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">Title</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={'e.g. "Week of Feb 3"'}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Period start</span>
          <input
            type="date"
            required
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Period end</span>
          <input
            type="date"
            required
            value={periodEnd}
            min={periodStart}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
      </div>

      <div className="flex items-center gap-5">
        <span className="text-sm font-medium text-neutral-700">Categories:</span>
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={transport}
            onChange={(e) => setTransport(e.target.checked)}
            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
          />
          Transport
        </label>
        <label className="inline-flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={entertainment}
            onChange={(e) => setEntertainment(e.target.checked)}
            className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
          />
          Entertainment
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
      >
        {saving ? "Creating…" : "Create Claim"}
      </button>
    </form>
  );
}
