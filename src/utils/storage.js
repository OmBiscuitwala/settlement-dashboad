export const STORAGE_KEYS = {
  AGENT_RESULT: "agentResult",
  SETTLEMENT_STATUS: "settlementStatus",
  BILL_AUDIT_RESULTS: "billAuditResults",
  MERCHANTS_LIST: "merchantsList",
};

export function readJSON(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
