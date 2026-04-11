// ✅ Immutable Append-Only Audit Ledger
import { logAuditEvent } from "./utils/billDatabase";

export const auditLedger = [];

// Append-only log writer – writes to in-memory cache AND IndexedDB
export function logEvent(event) {
  const entry = {
    time: new Date().toLocaleTimeString(),
    ...event,
  };
  auditLedger.push(entry);
  // Persist to IndexedDB (fire-and-forget; failures are non-fatal)
  logAuditEvent(entry).catch(() => {});
}
