import React, { useEffect, useState, useCallback } from "react";
import { getAllBills, getBillsByMerchant, updateBillAuditResult } from "../utils/billDatabase";
import { auditMerchantBill } from "../utils/billSettlementAuditor";
import "./Bills.css";

function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>{status}</span>
  );
}

function BillRow({ bill, onReaudit }) {
  const [expanded, setExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [reauditRunning, setReauditRunning] = useState(false);

  // Revoke object URL when component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleExpand = () => {
    setExpanded((prev) => {
      if (!prev && bill.fileBlob && !previewUrl) {
        // Create object URL from stored raw file blob for visual cross-check
        try {
          const url = URL.createObjectURL(bill.fileBlob);
          setPreviewUrl(url);
        } catch {
          // blob may not be available (e.g., old records); ignore
        }
      }
      return !prev;
    });
  };

  const handleReaudit = async (e) => {
    e.stopPropagation();
    setReauditRunning(true);
    try {
      // Compute running outstanding from all bills audited before this one for the same merchant
      const merchantBills = await getBillsByMerchant(bill.merchantId);
      const sortedBills = [...merchantBills].sort(
        (a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt)
      );
      let runningOutstanding = 0;
      for (const b of sortedBills) {
        if (b.id === bill.id) break;
        if (b.auditResult?.new_outstanding_total != null) {
          runningOutstanding = b.auditResult.new_outstanding_total;
        }
      }

      const auditResult = auditMerchantBill({
        merchant_id: bill.merchantId,
        bill_text: bill.ocrText || "",
        previous_outstanding_amount: runningOutstanding,
      });
      const agentStatus = auditResult.is_verification_passed
        ? "AUDITED"
        : "FLAGGED";
      await updateBillAuditResult(bill.id, auditResult, agentStatus);
      onReaudit();
    } catch (err) {
      console.error("Re-audit failed:", err);
    } finally {
      setReauditRunning(false);
    }
  };

  const uploadDate = bill.uploadedAt
    ? new Date(bill.uploadedAt).toLocaleString()
    : "—";

  return (
    <>
      <tr onClick={handleExpand}>
        <td>{bill.merchantId}</td>
        <td>{bill.fileName || "—"}</td>
        <td>{uploadDate}</td>
        <td>{bill.parsedAmount != null ? `₹${bill.parsedAmount}` : "—"}</td>
        <td>
          {bill.ocrConfidence != null
            ? `${Math.round(bill.ocrConfidence)}%`
            : "—"}
        </td>
        <td>
          <StatusBadge status={bill.agentStatus || "PENDING"} />
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div className="bill-expanded">
              <div className="bill-expanded-grid">
                {/* Left: OCR text */}
                <div>
                  <h4>Extracted OCR Text</h4>
                  <pre className="ocr-text">{bill.ocrText || "(no text)"}</pre>
                  <button
                    className="re-audit-btn"
                    onClick={handleReaudit}
                    disabled={reauditRunning}
                  >
                    {reauditRunning ? "Re-auditing…" : "↺ Re-run Audit"}
                  </button>
                </div>

                {/* Right: raw file preview + parsed data */}
                <div>
                  <h4>Raw File Preview</h4>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Bill preview"
                      className="file-preview"
                    />
                  ) : (
                    <p style={{ color: "#94a3b8", fontSize: 13 }}>
                      Preview not available
                    </p>
                  )}

                  <h4 style={{ marginTop: 16 }}>Parsed Data</h4>
                  <table style={{ fontSize: 13, width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ color: "#64748b", paddingRight: 12 }}>Amount</td>
                        <td><b>₹{bill.parsedAmount ?? "—"}</b></td>
                      </tr>
                      <tr>
                        <td style={{ color: "#64748b" }}>Fee</td>
                        <td><b>₹{bill.parsedFee ?? "—"}</b></td>
                      </tr>
                      {bill.auditResult && (
                        <>
                          <tr>
                            <td style={{ color: "#64748b" }}>Auditor Total</td>
                            <td><b>₹{bill.auditResult.extracted_bill_total}</b></td>
                          </tr>
                          <tr>
                            <td style={{ color: "#64748b" }}>Confidence</td>
                            <td>
                              <b>{Math.round((bill.auditResult.confidence_score ?? 0) * 100)}%</b>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ color: "#64748b" }}>Verified</td>
                            <td>
                              <b>
                                {bill.auditResult.is_verification_passed
                                  ? "✅ Yes"
                                  : "❌ No"}
                              </b>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await getAllBills();
    setBills(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bills-page">
      <h2>📋 Uploaded Bills</h2>

      {loading ? (
        <p>Loading bills…</p>
      ) : bills.length === 0 ? (
        <div className="bills-table-wrap">
          <div className="empty-bills">
            No bills uploaded yet. Open a merchant profile and upload an invoice.
          </div>
        </div>
      ) : (
        <div className="bills-table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th>Merchant</th>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Extracted Amount</th>
                <th>OCR Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <BillRow key={bill.id} bill={bill} onReaudit={load} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Bills;
