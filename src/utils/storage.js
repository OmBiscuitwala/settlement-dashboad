export const STORAGE_KEYS = {
  AGENT_RESULT: "agentResult",
  SETTLEMENT_STATUS: "settlementStatus",
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
