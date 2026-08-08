## Intelligence Layer — Expense Tracking

### Messy inputs (later)
- Free-text vendor names, inconsistent date formats, missing purposes.
- Receipt photos (later, not v1).

### Auto-structure schema (JSON example)
```json
{
  "vendor_raw": "grab "
  "normalized_vendor": "Grab",
  "category": "transport",
  "confidence": 0.92,
  "source": "vendor_match_rule",
  "review_status": "unreviewed"
}
```

### Events to track
- `line_item.created` — trigger auto-tag if vendor matches known list
- `claim.finalized` — trigger summary generation
- `claim.exported` — log export event

### Scoring rules (v1 — rule-based, no AI)
- **Vendor match**: if `vendor` matches known transport vendors (Grab, SBS, SMRT, ComfortDelGro), tag `transport`; if matches entertainment vendors (Netflix, GrabFood, Klook), tag `entertainment`. Confidence 1.0 on match, else 0.
- **Category mismatch flag**: if user-entered category differs from auto-tag, set `review_status = 'needs_review'`.

### What gets ranked (later)
- Claims by submission latency (oldest period first) — nudges timely submission.
- Line items by confidence (lowest first) for review.

### v1 vs later
- **v1**: rule-based vendor → category auto-tag on line-item save.
- **Later**: LLM-based vendor normalization, receipt OCR, anomaly detection on amounts.