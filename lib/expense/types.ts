export type ClaimStatus = "draft" | "finalized";
export type Category = "transport" | "entertainment";
export type ReceiptStatus = "none" | "attached" | "lost";

export interface ExpenseClaim {
  id: string;
  user_id: string | null;
  title: string;
  period_start: string;
  period_end: string;
  categories: Category[];
  currency: string;
  status: ClaimStatus;
  grand_total: number;
  created_at: string;
}

export interface LineItem {
  id: string;
  claim_id: string;
  user_id: string | null;
  date: string;
  vendor: string;
  category: Category;
  amount: number;
  currency: string;
  purpose: string;
  receipt_status: ReceiptStatus;
  ai_category_tag: string | null;
  ai_category_source: string | null;
  ai_category_confidence: number | null;
  ai_category_review: string;
  created_at: string;
}

export interface ClaimSummary {
  claim: ExpenseClaim;
  items: LineItem[];
  subtotals: Record<Category, number>;
  grand_total: number;
  item_count: number;
  generated_at: string;
}
