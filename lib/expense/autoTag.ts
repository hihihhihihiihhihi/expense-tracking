import type { Category } from "./types";

// Rule-based vendor → category auto-tag (docs/INTELLIGENCE_LAYER.md).
// Longer names first so "GrabFood" wins over "Grab".
const VENDOR_RULES: { match: string; category: Category }[] = [
  { match: "grabfood", category: "entertainment" },
  { match: "comfortdelgro", category: "transport" },
  { match: "netflix", category: "entertainment" },
  { match: "klook", category: "entertainment" },
  { match: "grab", category: "transport" },
  { match: "smrt", category: "transport" },
  { match: "sbs", category: "transport" },
];

export interface AutoTag {
  ai_category_tag: Category | null;
  ai_category_source: string | null;
  ai_category_confidence: number;
  ai_category_review: "unreviewed" | "needs_review";
}

export function autoTagVendor(vendor: string, userCategory: Category): AutoTag {
  const normalized = vendor.trim().toLowerCase();
  const rule = VENDOR_RULES.find((r) => normalized.includes(r.match));

  if (!rule) {
    return {
      ai_category_tag: null,
      ai_category_source: null,
      ai_category_confidence: 0,
      ai_category_review: "unreviewed",
    };
  }

  return {
    ai_category_tag: rule.category,
    ai_category_source: "vendor_match_rule",
    ai_category_confidence: 1.0,
    ai_category_review: rule.category === userCategory ? "unreviewed" : "needs_review",
  };
}
