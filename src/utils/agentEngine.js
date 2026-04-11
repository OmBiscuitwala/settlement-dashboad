/**
 * Rule-Based Settlement Agent Engine
 *
 * Pipeline:
 *   Stage 1 – Prompt Parser
 *   Stage 2 – Bill Audit Agent
 *   Stage 3 – Settlement Calculator
 *   Stage 4 – Payment Processor
 */

import { calculateSettlement, getBlockedReason } from "./settlement";
import { auditMerchantBill } from "./billSettlementAuditor";
import {
  getBillsByMerchant,
  updateBillAuditResult,
  logAuditEvent,
} from "./billDatabase";
import { STORAGE_KEYS } from "./storage";

const BILL_VARIANCE_THRESHOLD = 0.1; // 10 %
const LOW_CONFIDENCE_THRESHOLD = 60;  // OCR confidence %

// ── Stage 1: Prompt Parser ─────────────────────────────────────────────────────

function parsePrompt(prompt, merchants) {
  const lower = prompt.toLowerCase();

  const INTENT_KEYWORDS = ["settle", "audit", "process", "calculate", "pay"];
  const hasIntent = INTENT_KEYWORDS.some((kw) => lower.includes(kw));

  if (!hasIntent) {
    return { error: "❌ Could not detect a settlement intent in the prompt." };
  }

  const match = merchants
    .map((m) => ({ merchant: m, normalized: m.name.toLowerCase() }))
    .find(({ normalized }) => lower.includes(normalized));

  if (!match) {
    return { error: "❌ No matching merchant found in the prompt." };
  }

  return {
    merchantId: match.merchant.id,
    merchantName: match.merchant.name,
    merchant: match.merchant,
    intent: "SETTLE",
  };
}

// ── Stage 2: Bill Audit ────────────────────────────────────────────────────────

async function auditBills(merchant, emitStep) {
  const bills = await getBillsByMerchant(merchant.id);

  emitStep(
    `Bills Loaded from Database ✅ — ${bills.length} bill(s) found for ${merchant.name}`
  );

  const auditedBills = [];
  let flagCount = 0;
  let runningOutstanding = 0;

  for (const bill of bills) {
    const auditResult = auditMerchantBill({
      merchant_id: bill.merchantId,
      bill_text: bill.ocrText || "",
      previous_outstanding_amount: runningOutstanding,
    });

    let agentStatus = "AUDITED";
    const flags = [];

    // Rule: OCR confidence too low
    if ((bill.ocrConfidence ?? 100) < LOW_CONFIDENCE_THRESHOLD) {
      flags.push("LOW_CONFIDENCE");
    }

    // Rule: auditor could not verify
    if (!auditResult.is_verification_passed) {
      flags.push("UNVERIFIED");
    }

    // Rule: parsed amount vs auditor-extracted amount differ by > 10 %
    if (
      bill.parsedAmount &&
      auditResult.extracted_bill_total > 0
    ) {
      const diff =
        Math.abs(bill.parsedAmount - auditResult.extracted_bill_total) /
        Math.max(bill.parsedAmount, 1);
      if (diff > BILL_VARIANCE_THRESHOLD) {
        flags.push("MISMATCH");
      }
    }

    if (flags.length > 0) {
      agentStatus = "FLAGGED";
      flagCount++;
      emitStep(
        `⚠ Bill #${bill.id} Flagged — Reason: ${flags.join(", ")}`
      );
    } else {
      emitStep(
        `Bill #${bill.id} Audited ✅ — Amount ₹${auditResult.extracted_bill_total}, Confidence ${Math.round((bill.ocrConfidence ?? auditResult.confidence_score * 100))}%`
      );
    }

    await updateBillAuditResult(bill.id, auditResult, agentStatus);

    // Carry forward the new outstanding total for the next bill
    runningOutstanding = auditResult.new_outstanding_total;

    auditedBills.push({ ...bill, auditResult, agentStatus, flags });
  }

  return { bills: auditedBills, flagCount };
}

// ── Stage 3: Settlement Calculator ────────────────────────────────────────────

function calculateSettlementWithBills(merchant, auditedBills, emitStep) {
  const txnSummary = calculateSettlement(merchant.transactions);
  const transactionNetPayable = txnSummary.netPayable;

  emitStep(
    `Settlement Calculated ✅ — Transaction Total: ₹${transactionNetPayable}`
  );

  const validBills = auditedBills.filter((b) => b.agentStatus === "AUDITED");
  let billBasedTotal = null;
  let variance = null;
  let humanReviewRequired = false;

  if (validBills.length > 0) {
    billBasedTotal = validBills.reduce(
      (sum, b) => sum + (b.auditResult?.extracted_bill_total ?? 0),
      0
    );
    variance = Math.abs(transactionNetPayable - billBasedTotal);
    const variancePct =
      variance / Math.max(transactionNetPayable, 1);

    emitStep(
      `Bill Audit Total: ₹${billBasedTotal} | Variance: ₹${variance.toFixed(2)}`
    );

    if (variancePct > BILL_VARIANCE_THRESHOLD) {
      humanReviewRequired = true;
      emitStep("⚠ Variance Exceeds Threshold — Human Review Required");
    }
  } else {
    emitStep("No bills on record — using transaction data only");
  }

  return {
    transactionNetPayable,
    billBasedTotal,
    variance,
    humanReviewRequired,
    txnSummary,
  };
}

// ── Stage 4: Payment Processor ─────────────────────────────────────────────────

function processPayment(
  { merchant, transactionNetPayable, humanReviewRequired, flagCount },
  mode,
  emitStep
) {
  // Existing business rule checks (bank mismatch, suspicious flag, threshold)
  const blockedReason = getBlockedReason(merchant, transactionNetPayable);

  if (blockedReason) {
    emitStep(`❌ Payment Blocked — ${blockedReason}`);
    return { status: "BLOCKED", reason: blockedReason };
  }

  if (flagCount > 0) {
    const reason = `${flagCount} bill(s) flagged during audit`;
    emitStep(`❌ Payment Blocked — ${reason}`);
    return { status: "BLOCKED", reason };
  }

  if (humanReviewRequired) {
    const reason = "Bill vs transaction variance exceeds 10% threshold";
    emitStep(`❌ Payment Blocked — ${reason}`);
    return { status: "BLOCKED", reason };
  }

  if (mode === "SHADOW") {
    emitStep("Shadow Validation Complete — No payout executed");
    return { status: "SHADOW" };
  }

  // LIVE mode – authorize payment
  emitStep(
    `✅ Payment Authorized — ₹${transactionNetPayable} queued for disbursement`
  );
  localStorage.setItem(STORAGE_KEYS.SETTLEMENT_STATUS, "COMPLETED");
  return { status: "AUTHORIZED" };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * runSettlementWorkflow(prompt, merchants, mode, onStep)
 *
 * @param {string}   prompt     - free-text instruction from the user
 * @param {Array}    merchants  - full merchant list from data.js
 * @param {string}   mode       - "LIVE" | "SHADOW"
 * @param {Function} [onStep]   - optional callback invoked with each step string as the pipeline runs
 * @returns {Object} agentResult - matches shape expected by AgentConsole
 */
export async function runSettlementWorkflow(prompt, merchants, mode = "LIVE", onStep) {
  const steps = [];
  const emitStep = (msg) => {
    steps.push(msg);
    if (typeof onStep === "function") onStep(msg);
  };

  // Stage 1 – Parse Prompt
  const parsed = parsePrompt(prompt, merchants);
  if (parsed.error) {
    return { error: parsed.error, steps };
  }

  const { merchant, merchantId, merchantName } = parsed;
  emitStep(
    `Intent Parsed ✅ — Merchant: ${merchantName}, Action: Settle & Audit`
  );

  await logAuditEvent({
    event: `Agent workflow started for ${merchantName}`,
    level: "INFO",
  });

  // Stage 2 – Audit Bills
  const { bills: auditedBills, flagCount } = await auditBills(
    merchant,
    emitStep
  );

  // Stage 3 – Calculate Settlement
  const {
    transactionNetPayable,
    billBasedTotal,
    variance,
    humanReviewRequired,
    txnSummary,
  } = calculateSettlementWithBills(merchant, auditedBills, emitStep);

  // Stage 4 – Process Payment
  const paymentResult = processPayment(
    { merchant, transactionNetPayable, humanReviewRequired, flagCount },
    mode,
    emitStep
  );

  await logAuditEvent({
    event: `Agent prepared settlement draft for ${merchantName} — status: ${paymentResult.status}`,
    level: paymentResult.status === "BLOCKED" ? "HIGH" : "MEDIUM",
  });

  const billAuditSummary = {
    totalBills: auditedBills.length,
    flaggedBills: flagCount,
    billBasedTotal,
    transactionNetPayable,
    variance,
  };

  return {
    prompt,
    merchantId,
    merchantName,
    netPayable: transactionNetPayable,
    steps,
    paymentStatus: paymentResult.status,
    paymentReason: paymentResult.reason || null,
    billAuditSummary,
    txnSummary,
  };
}
