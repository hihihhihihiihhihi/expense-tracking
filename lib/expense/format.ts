export function formatMoney(amount: number, currency: string = "SGD"): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-SG",
    { day: "numeric", month: "short", year: "numeric" },
  );
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
