import Dexie from "dexie";

const db = new Dexie("SettlementDB");

db.version(1).stores({
  bills:
    "++id, merchantId, uploadedAt, fileName, ocrConfidence, parsedAmount, parsedFee, agentStatus",
  auditLog: "++id, time, event, level",
});

// ── Bills helpers ──────────────────────────────────────────────────────────────

export async function saveBill({
  merchantId,
  fileName,
  fileBlob,
  ocrText,
  ocrConfidence,
  parsedAmount,
  parsedFee,
}) {
  return db.bills.add({
    merchantId,
    uploadedAt: new Date().toISOString(),
    fileName,
    fileBlob,       // raw File object – used for visual cross-check / re-OCR
    ocrText,
    ocrConfidence,
    parsedAmount,
    parsedFee,
    auditResult: null,
    agentStatus: "PENDING",
  });
}

export async function getBillsByMerchant(merchantId) {
  return db.bills.where("merchantId").equals(merchantId).toArray();
}

export async function getAllBills() {
  return db.bills.orderBy("uploadedAt").reverse().toArray();
}

export async function updateBillAuditResult(id, auditResult, agentStatus) {
  return db.bills.update(id, { auditResult, agentStatus });
}

// ── Audit-log helpers ──────────────────────────────────────────────────────────

export async function logAuditEvent({ event, level }) {
  return db.auditLog.add({
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    event,
    level,
  });
}

export async function getAllAuditLogs() {
  return db.auditLog.orderBy("id").toArray();
}
