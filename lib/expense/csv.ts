import type { ExpenseClaim, LineItem } from "./types";

function esc(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildClaimCsv(claim: ExpenseClaim, items: LineItem[]): string {
  const lines: string[] = [];

  lines.push(`Claim,${esc(claim.title)}`);
  lines.push(`Period,${claim.period_start} to ${claim.period_end}`);
  lines.push(`Status,${claim.status}`);
  lines.push(`Currency,${claim.currency}`);
  lines.push("");
  lines.push("Date,Vendor,Category,Amount,Purpose,Receipt");

  let transport = 0;
  let entertainment = 0;
  for (const item of items) {
    const amount = Number(item.amount);
    if (item.category === "transport") transport += amount;
    else entertainment += amount;
    lines.push(
      [
        item.date,
        esc(item.vendor),
        item.category,
        amount.toFixed(2),
        esc(item.purpose || ""),
        item.receipt_status,
      ].join(","),
    );
  }

  lines.push("");
  lines.push(`Transport subtotal,,,${transport.toFixed(2)},,`);
  lines.push(`Entertainment subtotal,,,${entertainment.toFixed(2)},,`);
  lines.push(`Grand total,,,${(transport + entertainment).toFixed(2)},,`);

  return lines.join("\r\n") + "\r\n";
}
