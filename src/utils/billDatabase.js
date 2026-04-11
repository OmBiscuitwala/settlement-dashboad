import Dexie from "dexie";

const db = new Dexie("SettlementDB");

db.version(1).stores({
  bills:
    "++id, merchantId, uploadedAt, fileName, ocrConfidence, parsedAmount, parsedFee, agentStatus",
  auditLog: "++id, time, event, level",
});

// v2: add structured bill metadata fields
db.version(2).stores({
  bills:
    "++id, merchantId, uploadedAt, fileName, ocrConfidence, parsedAmount, parsedFee, agentStatus, billNumber, purpose, department, billDate, settlementDate",
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
  billNumber = "",
  purpose = "",
  department = "",
  billDate = "",
  settlementDate = "",
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
    billNumber,
    purpose,
    department,
    billDate,
    settlementDate,
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

export async function updateBillMetadata(id, metadata) {
  return db.bills.update(id, metadata);
}

// Save a manually-entered bill (no OCR / file)
export async function saveManualBill({
  merchantId,
  billNumber = "",
  purpose = "",
  department = "",
  billDate = "",
  settlementDate = "",
  parsedAmount = 0,
  parsedFee = 0,
}) {
  return db.bills.add({
    merchantId,
    uploadedAt: new Date().toISOString(),
    fileName: "Manual Entry",
    fileBlob: null,
    ocrText: "",
    ocrConfidence: null,
    parsedAmount,
    parsedFee,
    auditResult: null,
    agentStatus: "PENDING",
    billNumber,
    purpose,
    department,
    billDate,
    settlementDate,
  });
}

// ── Audit-log helpers ──────────────────────────────────────────────────────────

export async function logAuditEvent({ event, level }) {
  return db.auditLog.add({
    time: new Date().toISOString(),
    event,
    level,
  });
}

export async function getAllAuditLogs() {
  return db.auditLog.orderBy("id").toArray();
}
