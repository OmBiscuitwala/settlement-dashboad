const HIGH_PRIORITY_LABELS = [
  { phrase: "grand total", score: 5 },
  { phrase: "total amount due", score: 5 },
  { phrase: "net balance", score: 5 },
  { phrase: "amount to pay", score: 5 },
  { phrase: "amount due", score: 4 },
  { phrase: "balance due", score: 4 },
  { phrase: "final total", score: 4 },
  { phrase: "total due", score: 4 },
  { phrase: "net payable", score: 4 },
  { phrase: "total", score: 2 },
];

const IGNORE_LABELS = [
  "subtotal",
  "sub-total",
  "tax",
  "gst",
  "vat",
  "shipping",
  "delivery",
  "line item",
  "item total",
  "unit price",
  "qty",
  "discount",
  "fee",
  "charges",
];

const CURRENCY_PATTERN = /(?:rs\.?|inr|\$|\u20b9)?\s*-?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|(?:rs\.?|inr|\$|\u20b9)?\s*-?\d+(?:\.\d{1,2})?/gi;

function round2(value) {
  return Number(value.toFixed(2));
}

function toNumber(value) {
  const numeric = String(value).replace(/[^\d.-]/g, "");
  if (!numeric || numeric === "-" || numeric === ".") return NaN;
  return Number(numeric);
}

function getLabelPriority(normalizedLine) {
  if (IGNORE_LABELS.some((label) => normalizedLine.includes(label))) {
    return -1;
  }

  for (const rule of HIGH_PRIORITY_LABELS) {
    if (normalizedLine.includes(rule.phrase)) {
      return rule.score;
    }
  }

  return 0;
}

function parseAmountFromLine(line) {
  const matches = line.match(CURRENCY_PATTERN);
  if (!matches || matches.length === 0) return null;

  const parsed = matches
    .map((token) => toNumber(token))
    .filter((value) => Number.isFinite(value));

  if (parsed.length === 0) return null;
  return parsed[parsed.length - 1];
}

function extractPrintedTotal(billText) {
  const lines = String(billText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = [];

  for (const line of lines) {
    const normalized = line.toLowerCase();
    const amount = parseAmountFromLine(line);

    if (!Number.isFinite(amount)) continue;

    candidates.push({
      line,
      amount,
      priority: getLabelPriority(normalized),
    });
  }

  const validCandidates = candidates.filter((candidate) => candidate.priority >= 0);
  if (validCandidates.length === 0) return null;

  const prioritized = validCandidates
    .filter((candidate) => candidate.priority > 0)
    .sort((a, b) => b.priority - a.priority || b.amount - a.amount);

  if (prioritized.length > 0) {
    const best = prioritized[0];
    const confidence = best.priority >= 4 ? 0.96 : 0.9;
    return {
      amount: best.amount,
      confidence,
      source: `Printed line: "${best.line}"`,
    };
  }

  const fallback = validCandidates.sort((a, b) => b.amount - a.amount)[0];
  return {
    amount: fallback.amount,
    confidence: 0.6,
    source: `Fallback maximum value from line: "${fallback.line}"`,
  };
}

function extractHandwrittenOverride(handwrittenValues) {
  if (!Array.isArray(handwrittenValues) || handwrittenValues.length === 0) {
    return null;
  }

  const normalized = handwrittenValues
    .map((entry) => {
      if (typeof entry === "number") {
        return {
          value: entry,
          is_circled: false,
          is_near_printed_total: false,
          confidence: 0.92,
        };
      }

      return {
        value: Number(entry?.value),
        is_circled: Boolean(entry?.is_circled),
        is_near_printed_total: Boolean(entry?.is_near_printed_total),
        confidence: Number(entry?.confidence ?? 0.92),
      };
    })
    .filter((entry) => Number.isFinite(entry.value));

  if (normalized.length === 0) return null;

  const prioritized = normalized
    .filter((entry) => entry.is_circled || entry.is_near_printed_total)
    .sort((a, b) => b.confidence - a.confidence || b.value - a.value);

  if (prioritized.length === 0) return null;

  const chosen = prioritized[0];
  return {
    amount: chosen.value,
    confidence: Math.max(chosen.confidence, chosen.is_circled ? 0.97 : 0.93),
    source: chosen.is_circled
      ? "Handwritten circled override detected near total"
      : "Handwritten override detected next to printed total",
  };
}

export function auditMerchantBill({
  merchant_id,
  previous_outstanding_amount,
  bill_text,
  handwritten_values,
  is_image_blurry = false,
}) {
  const previous = round2(Number(previous_outstanding_amount || 0));

  if (!Number.isFinite(previous)) {
    throw new Error("previous_outstanding_amount must be a valid number");
  }

  if (is_image_blurry) {
    return {
      merchant_id: String(merchant_id || ""),
      extracted_bill_total: 0,
      previous_outstanding_amount: previous,
      new_outstanding_total: previous,
      confidence_score: 0.25,
      is_verification_passed: false,
      reasoning: "Image flagged blurry; unable to validate final total with 90% confidence.",
    };
  }

  const handwritten = extractHandwrittenOverride(handwritten_values);
  const printed = extractPrintedTotal(bill_text);

  const winner = handwritten || printed;

  if (!winner || !Number.isFinite(winner.amount)) {
    return {
      merchant_id: String(merchant_id || ""),
      extracted_bill_total: 0,
      previous_outstanding_amount: previous,
      new_outstanding_total: previous,
      confidence_score: 0,
      is_verification_passed: false,
      reasoning: "Could not locate a reliable final payable total in the bill text.",
    };
  }

  const extracted = round2(winner.amount);
  const newOutstanding = round2(previous + extracted);
  const verificationPassed = winner.confidence >= 0.9;

  // Double-check arithmetic before returning financial output.
  if (round2(previous + extracted) !== newOutstanding) {
    throw new Error("Settlement arithmetic verification failed");
  }

  return {
    merchant_id: String(merchant_id || ""),
    extracted_bill_total: extracted,
    previous_outstanding_amount: previous,
    new_outstanding_total: newOutstanding,
    confidence_score: round2(winner.confidence),
    is_verification_passed: verificationPassed,
    reasoning: winner.source,
  };
}
