import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { parseBill } from "../utils/billParser";
import { saveBill, saveManualBill, updateBillAuditResult } from "../utils/billDatabase";
import { auditMerchantBill } from "../utils/billSettlementAuditor";

// Fields the agent requires the user to confirm before saving
const REQUIRED_FIELDS = [
  { key: "billNumber",     label: "Bill Number / Reference ID" },
  { key: "purpose",        label: "Purpose" },
  { key: "department",     label: "Department" },
  { key: "billDate",       label: "Bill Date" },
  { key: "settlementDate", label: "Settlement Date" },
];

function MetadataForm({ initial = {}, onSave, onCancel, isNew }) {
  const [meta, setMeta] = useState({
    billNumber:     initial.billNumber     || "",
    purpose:        initial.purpose        || "",
    department:     initial.department     || "",
    billDate:       initial.billDate       || "",
    settlementDate: initial.settlementDate || "",
    parsedAmount:   initial.parsedAmount   != null ? String(initial.parsedAmount) : "",
    parsedFee:      initial.parsedFee      != null ? String(initial.parsedFee)    : "",
  });

  const [errors, setErrors] = useState({});

  const missing = REQUIRED_FIELDS.filter(f => !meta[f.key]?.trim());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeta(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    REQUIRED_FIELDS.forEach(f => {
      if (!meta[f.key]?.trim()) newErrors[f.key] = `${f.label} is required`;
    });
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    onSave({
      ...meta,
      parsedAmount: meta.parsedAmount ? Number(meta.parsedAmount) : 0,
      parsedFee:    meta.parsedFee    ? Number(meta.parsedFee)    : 0,
    });
  };

  return (
    <div style={{ marginTop: 16, padding: "16px 20px", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}>
      {/* Agent prompt banner if fields are missing */}
      {missing.length > 0 && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#92400e" }}>
              Agent could not extract all details from the {isNew ? "document" : "file"}.
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#78350f" }}>
              Please fill in: {missing.map(f => f.label).join(", ")}.
            </p>
          </div>
        </div>
      )}

      <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" }}>
        Bill Details
      </h4>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {REQUIRED_FIELDS.map(({ key, label }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{label} <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              type={key === "billDate" || key === "settlementDate" ? "date" : "text"}
              name={key}
              value={meta[key]}
              onChange={handleChange}
              placeholder={label}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: errors[key] ? "1px solid #ef4444" : "1px solid #cbd5e1",
                fontSize: 13,
                background: errors[key] ? "#fef2f2" : "#fff",
                outline: "none",
              }}
            />
            {errors[key] && <span style={{ fontSize: 11, color: "#ef4444" }}>{errors[key]}</span>}
          </div>
        ))}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Amount (₹)</label>
            <input
              type="number"
              name="parsedAmount"
              value={meta.parsedAmount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", outline: "none" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Fee (₹)</label>
            <input
              type="number"
              name="parsedFee"
              value={meta.parsedFee}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff", outline: "none" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            style={{ flex: 2, padding: "10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            💾 Save Bill
          </button>
        </div>
      </form>
    </div>
  );
}

function BillUploader({ onExtract, merchantId }) {
  const [mode, setMode] = useState(null); // null | "upload" | "manual"
  const [loading, setLoading] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [pendingData, setPendingData] = useState(null); // OCR result waiting for metadata
  const [pendingFile, setPendingFile] = useState(null);

  // Run OCR and then show metadata form
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setSavedId(null);
    setPendingData(null);

    let extractedText = "";
    let ocrConfidence = 0;

    try {
      if (file.type === "application/pdf") {
        const { extractBillTextFromImage } = await import("../utils/billOcr");
        const result = await extractBillTextFromImage(file);
        extractedText = result.text;
        ocrConfidence = result.confidence;
      } else {
        const result = await Tesseract.recognize(file, "eng", { logger: m => console.log(m) });
        extractedText = result.data.text;
        ocrConfidence = result.data.confidence;
      }
    } catch (err) {
      console.error("OCR failed:", err);
    }

    const parsed = parseBill(extractedText);

    setPendingFile(file);
    setPendingData({
      ocrText: extractedText,
      ocrConfidence,
      parsedAmount: parsed.amount || 0,
      parsedFee: parsed.fee || 0,
      fileName: file.name,
    });
    setMode("upload");
    setLoading(false);
  };

  const handleSaveUpload = async (meta) => {
    if (!merchantId || !pendingFile) return;
    try {
      const id = await saveBill({
        merchantId,
        fileName: pendingFile.name,
        fileBlob: pendingFile,
        ocrText: pendingData.ocrText,
        ocrConfidence: pendingData.ocrConfidence,
        parsedAmount: meta.parsedAmount,
        parsedFee: meta.parsedFee,
        billNumber: meta.billNumber,
        purpose: meta.purpose,
        department: meta.department,
        billDate: meta.billDate,
        settlementDate: meta.settlementDate,
      });

      // Run initial audit
      try {
        const auditResult = auditMerchantBill({
          merchant_id: merchantId,
          bill_text: pendingData.ocrText,
          previous_outstanding_amount: 0,
          is_image_blurry: pendingData.ocrConfidence < 60,
        });
        const agentStatus = auditResult.is_verification_passed ? "AUDITED" : "FLAGGED";
        await updateBillAuditResult(id, auditResult, agentStatus);
      } catch { /* audit failure is non-fatal */ }

      setSavedId(id);
      setPendingData(null);
      setPendingFile(null);
      setMode(null);
      if (onExtract) onExtract(pendingData.ocrText);
    } catch (err) {
      console.error("Failed to save bill:", err);
    }
  };

  const handleSaveManual = async (meta) => {
    if (!merchantId) return;
    try {
      await saveManualBill({
        merchantId,
        billNumber: meta.billNumber,
        purpose: meta.purpose,
        department: meta.department,
        billDate: meta.billDate,
        settlementDate: meta.settlementDate,
        parsedAmount: meta.parsedAmount,
        parsedFee: meta.parsedFee,
      });
      setSavedId("manual");
      setMode(null);
      if (onExtract) onExtract("");
    } catch (err) {
      console.error("Failed to save manual bill:", err);
    }
  };

  return (
    <div style={{ marginTop: "16px" }}>
      {mode === null && (
        <div style={{ display: "flex", gap: 10 }}>
          <label
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 18px", background: "#4f46e5", color: "#fff",
              borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            <span>📄</span> Upload Bill (JPG / PDF)
            <input
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
          </label>
          <button
            onClick={() => setMode("manual")}
            style={{
              padding: "10px 18px", background: "#f8fafc", color: "#334155",
              border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer",
              fontSize: 13, fontWeight: 600,
            }}
          >
            ✏️ Enter Manually
          </button>
        </div>
      )}

      {loading && <p style={{ color: "#4f46e5", marginTop: 10, fontSize: 13 }}>🔍 Processing document…</p>}

      {mode === "upload" && pendingData && (
        <MetadataForm
          initial={pendingData}
          onSave={handleSaveUpload}
          onCancel={() => { setMode(null); setPendingData(null); setPendingFile(null); }}
          isNew={false}
        />
      )}

      {mode === "manual" && (
        <MetadataForm
          initial={{}}
          onSave={handleSaveManual}
          onCancel={() => setMode(null)}
          isNew={true}
        />
      )}

      {savedId != null && (
        <p style={{ color: "#16a34a", marginTop: 10, fontSize: 13, fontWeight: 600 }}>
          ✅ Bill saved successfully
        </p>
      )}
    </div>
  );
}

export default BillUploader;