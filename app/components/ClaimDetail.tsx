"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatDate, todayISO } from "@/lib/expense/format";
import type { Category, ClaimSummary, ExpenseClaim, LineItem } from "@/lib/expense/types";

const inputCls =
  "w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-neutral-100";

type ItemDraft = {
  date: string;
  vendor: string;
  category: Category;
  amount: string;
  purpose: string;
  receipt_status: string;
};

const emptyDraft = (date: string): ItemDraft => ({
  date,
  vendor: "",
  category: "transport",
  amount: "",
  purpose: "",
  receipt_status: "none",
});

export default function ClaimDetail({
  initialClaim,
  initialItems,
}: {
  initialClaim: ExpenseClaim;
  initialItems: LineItem[];
}) {
  const router = useRouter();
  const [claim, setClaim] = useState(initialClaim);
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState<ItemDraft>(
    emptyDraft(initialClaim.period_start ?? todayISO()),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ItemDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ClaimSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const readonly = claim.status === "finalized";

  const subtotals = useMemo(() => {
    const t = { transport: 0, entertainment: 0 };
    for (const item of items) t[item.category] += Number(item.amount);
    return t;
  }, [items]);
  const liveTotal = subtotals.transport + subtotals.entertainment;

  async function api(path: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const data = await api(`/api/claims/${claim.id}/items`, {
      method: "POST",
      body: JSON.stringify({ ...draft, amount: Number(draft.amount) }),
    });
    if (data) {
      setItems((prev) => [...prev, data.item]);
      setClaim((prev) => ({ ...prev, grand_total: data.grand_total }));
      setDraft((prev) => ({ ...emptyDraft(prev.date), date: prev.date }));
      setSummary(null);
      router.refresh();
    }
  }

  function startEdit(item: LineItem) {
    setEditingId(item.id);
    setEditDraft({
      date: item.date,
      vendor: item.vendor,
      category: item.category,
      amount: String(item.amount),
      purpose: item.purpose,
      receipt_status: item.receipt_status,
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft) return;
    const data = await api(`/api/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ ...editDraft, amount: Number(editDraft.amount) }),
    });
    if (data) {
      setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
      setClaim((prev) => ({ ...prev, grand_total: data.grand_total }));
      setEditingId(null);
      setEditDraft(null);
      setSummary(null);
      router.refresh();
    }
  }

  async function deleteItem(item: LineItem) {
    if (!confirm(`Delete ${item.vendor} — ${formatMoney(Number(item.amount), item.currency)}?`))
      return;
    const data = await api(`/api/items/${item.id}`, { method: "DELETE" });
    if (data) {
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      setClaim((prev) => ({ ...prev, grand_total: data.grand_total }));
      setSummary(null);
      router.refresh();
    }
  }

  async function setStatus(status: "draft" | "finalized") {
    if (status === "finalized" && !confirm("Finalize this claim? Items become read-only."))
      return;
    const data = await api(`/api/claims/${claim.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (data) {
      setClaim(data.claim);
      router.refresh();
    }
  }

  async function generateSummary() {
    setSummaryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claim.id}/summary`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function deleteClaim() {
    if (!confirm(`Delete claim "${claim.title}" and all its items? This cannot be undone.`))
      return;
    const data = await api(`/api/claims/${claim.id}`, { method: "DELETE" });
    if (data) {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{claim.title}</h1>
              {readonly ? (
                <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                  Finalized
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                  Draft
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {formatDate(claim.period_start)} – {formatDate(claim.period_end)}
              <span className="mx-2 text-neutral-300">·</span>
              {claim.categories.join(" + ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={generateSummary}
              disabled={summaryLoading || items.length === 0}
              className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              title={items.length === 0 ? "Add line items first" : undefined}
            >
              {summaryLoading ? "Generating…" : "Generate Summary"}
            </button>
            <a
              href={`/api/claims/${claim.id}/export`}
              download
              className={`rounded-lg border border-indigo-300 text-indigo-700 px-3 py-1.5 text-sm font-medium hover:bg-indigo-50 ${items.length === 0 ? "pointer-events-none opacity-50" : ""}`}
            >
              Export CSV
            </a>
            {readonly ? (
              <button
                onClick={() => setStatus("draft")}
                disabled={busy}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Revert to draft
              </button>
            ) : (
              <button
                onClick={() => setStatus("finalized")}
                disabled={busy}
                className="rounded-lg bg-green-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Finalize claim
              </button>
            )}
            <button
              onClick={deleteClaim}
              disabled={busy}
              className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Totals strip */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md bg-neutral-50 border border-neutral-200 px-3 py-2">
            <div className="text-xs text-neutral-500">Transport</div>
            <div className="font-semibold tabular-nums">
              {formatMoney(subtotals.transport, claim.currency)}
            </div>
          </div>
          <div className="rounded-md bg-neutral-50 border border-neutral-200 px-3 py-2">
            <div className="text-xs text-neutral-500">Entertainment</div>
            <div className="font-semibold tabular-nums">
              {formatMoney(subtotals.entertainment, claim.currency)}
            </div>
          </div>
          <div className="rounded-md bg-indigo-50 border border-indigo-200 px-3 py-2">
            <div className="text-xs text-indigo-600">Grand total</div>
            <div className="font-bold tabular-nums text-indigo-700">
              {formatMoney(liveTotal, claim.currency)}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {readonly && (
        <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          This claim is finalized and read-only. Revert to draft to make changes.
        </div>
      )}

      {/* Line items */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-semibold">
            Line items{" "}
            <span className="text-sm font-normal text-neutral-400">({items.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200 bg-neutral-50">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium">Purpose</th>
                <th className="px-3 py-2 font-medium">Receipt</th>
                <th className="px-3 py-2 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-neutral-400">
                    No items yet — add your first expense below.
                  </td>
                </tr>
              )}
              {items.map((item) =>
                editingId === item.id && editDraft ? (
                  <tr key={item.id} className="border-b border-neutral-100 bg-indigo-50/40">
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={editDraft.date}
                        onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={editDraft.vendor}
                        onChange={(e) => setEditDraft({ ...editDraft, vendor: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={editDraft.category}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, category: e.target.value as Category })
                        }
                        className={inputCls}
                      >
                        <option value="transport">Transport</option>
                        <option value="entertainment">Entertainment</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editDraft.amount}
                        onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                        className={`${inputCls} text-right`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={editDraft.purpose}
                        onChange={(e) => setEditDraft({ ...editDraft, purpose: e.target.value })}
                        className={inputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={editDraft.receipt_status}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, receipt_status: e.target.value })
                        }
                        className={inputCls}
                      >
                        <option value="none">None</option>
                        <option value="attached">Attached</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <button
                        onClick={() => saveEdit(item.id)}
                        disabled={busy}
                        className="text-indigo-600 hover:text-indigo-800 font-medium mr-2 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft(null);
                        }}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-3 py-2 font-medium">{item.vendor}</td>
                    <td className="px-3 py-2">
                      <CategoryChip category={item.category} />
                      {item.ai_category_review === "needs_review" && (
                        <span
                          className="ml-1.5 text-xs text-amber-600"
                          title={`Auto-tag suggests "${item.ai_category_tag}" for this vendor — double-check the category`}
                        >
                          ⚠ review
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatMoney(Number(item.amount), item.currency)}
                    </td>
                    <td className="px-3 py-2 text-neutral-500 max-w-48 truncate">
                      {item.purpose}
                    </td>
                    <td className="px-3 py-2">
                      <ReceiptChip status={item.receipt_status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      {!readonly && (
                        <>
                          <button
                            onClick={() => startEdit(item)}
                            disabled={busy}
                            className="text-neutral-400 hover:text-indigo-600 mr-2 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item)}
                            disabled={busy}
                            className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        {/* Add row */}
        {!readonly && (
          <form
            onSubmit={addItem}
            className="border-t border-neutral-200 bg-neutral-50/60 px-3 py-3 grid grid-cols-2 sm:grid-cols-7 gap-2 items-end"
          >
            <label className="block">
              <span className="text-xs text-neutral-500">Date</span>
              <input
                type="date"
                required
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Vendor</span>
              <input
                type="text"
                required
                placeholder="Grab, SMRT…"
                value={draft.vendor}
                onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Category</span>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}
                className={inputCls}
              >
                <option value="transport">Transport</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Amount</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                className={`${inputCls} text-right`}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Purpose</span>
              <input
                type="text"
                placeholder="Business purpose"
                value={draft.purpose}
                onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs text-neutral-500">Receipt</span>
              <select
                value={draft.receipt_status}
                onChange={(e) => setDraft({ ...draft, receipt_status: e.target.value })}
                className={inputCls}
              >
                <option value="none">None</option>
                <option value="attached">Attached</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 h-fit"
            >
              {busy ? "Adding…" : "+ Add"}
            </button>
          </form>
        )}
      </div>

      {/* Summary report */}
      {summary && (
        <div id="summary" className="rounded-lg border border-indigo-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-indigo-100 bg-indigo-50/50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-indigo-900">Summary Report</h2>
              <p className="text-xs text-indigo-400 mt-0.5">
                {summary.claim.title} · {formatDate(summary.claim.period_start)} –{" "}
                {formatDate(summary.claim.period_end)} · generated{" "}
                {new Date(summary.generated_at).toLocaleString("en-SG")}
              </p>
            </div>
            <a
              href={`/api/claims/${claim.id}/export`}
              download
              className="rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-indigo-700"
            >
              Download CSV
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-neutral-200">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Purpose</th>
                  <th className="px-3 py-2 font-medium">Receipt</th>
                  <th className="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="px-3 py-1.5 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="px-3 py-1.5 font-medium">{item.vendor}</td>
                    <td className="px-3 py-1.5">
                      <CategoryChip category={item.category} />
                    </td>
                    <td className="px-3 py-1.5 text-neutral-500">{item.purpose}</td>
                    <td className="px-3 py-1.5">
                      <ReceiptChip status={item.receipt_status} />
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {formatMoney(Number(item.amount), item.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200">
                  <td colSpan={5} className="px-3 py-1.5 text-right text-neutral-500">
                    Transport subtotal
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                    {formatMoney(summary.subtotals.transport, summary.claim.currency)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={5} className="px-3 py-1.5 text-right text-neutral-500">
                    Entertainment subtotal
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                    {formatMoney(summary.subtotals.entertainment, summary.claim.currency)}
                  </td>
                </tr>
                <tr className="border-t-2 border-indigo-200 bg-indigo-50/50">
                  <td colSpan={5} className="px-3 py-2 text-right font-semibold text-indigo-900">
                    Grand total ({summary.item_count} item{summary.item_count === 1 ? "" : "s"})
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-bold text-indigo-700">
                    {formatMoney(summary.grand_total, summary.claim.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({ category }: { category: Category }) {
  return category === "transport" ? (
    <span className="inline-flex rounded-full bg-sky-100 text-sky-700 px-2 py-0.5 text-xs font-medium">
      Transport
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium">
      Entertainment
    </span>
  );
}

function ReceiptChip({ status }: { status: string }) {
  if (status === "attached")
    return <span className="text-xs text-green-600 font-medium">Attached</span>;
  if (status === "lost")
    return <span className="text-xs text-red-500 font-medium">Lost</span>;
  return <span className="text-xs text-neutral-400">None</span>;
}
