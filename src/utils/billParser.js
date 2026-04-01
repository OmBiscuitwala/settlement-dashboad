export function parseBill(text) {

  const merchantMatch = text.match(/merchant[:\-]?\s*(.*)/i);
  const amountMatch = text.match(/total[:\-]?\s*₹?(\d+)/i);
  const feeMatch = text.match(/fee[:\-]?\s*₹?(\d+)/i);

  const merchant = merchantMatch ? merchantMatch[1].trim() : "Unknown Merchant";
  const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
  const fee = feeMatch ? parseInt(feeMatch[1]) : 0;

  return {
    merchant,
    amount,
    fee
  };
}