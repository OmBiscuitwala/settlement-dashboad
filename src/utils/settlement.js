export const SETTLEMENT_THRESHOLD = 100000;

export function calculateSettlement(transactions = []) {
  const summary = transactions.reduce(
    (acc, tx) => {
      acc.total += tx.amount;
      acc.fees += tx.fee;
      acc.refunds += tx.refund;
      return acc;
    },
    { total: 0, fees: 0, refunds: 0, netPayable: 0 }
  );
  summary.netPayable = summary.total - summary.fees - summary.refunds;
  return summary;
}

export function getBlockedReason(merchant, netPayable) {
  if (merchant.bankMismatch) {
    return "Bank account mismatch detected - Settlement blocked";
  }

  if (merchant.flagged) {
    return "Merchant flagged suspicious - Manual escalation required";
  }

  if (netPayable > SETTLEMENT_THRESHOLD) {
    return "Amount exceeds INR 1,00,000 threshold - Level-2 Approval Required";
  }

  return "";
}
