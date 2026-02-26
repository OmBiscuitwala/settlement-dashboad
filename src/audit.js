// ✅ Immutable Append-Only Audit Ledger

export const auditLedger = [];

// Append-only log writer
export function logEvent(event) {
  auditLedger.push({
    time: new Date().toLocaleTimeString(),
    ...event,
  });
}
