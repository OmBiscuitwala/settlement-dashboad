import React, { useMemo, useState } from "react";
import AgentOverlay from "../components/AgentOverlay";
import { Link, useNavigate } from "react-router-dom";
import { useMerchants } from "../context/MerchantContext";
import { auditMerchantBill } from "../utils/billSettlementAuditor";
import { readJSON, STORAGE_KEYS, writeJSON } from "../utils/storage";

function getPreviousOutstandingFromProfit(merchant) {
  const profit = Number(merchant?.profit);
  if (!Number.isFinite(profit) || profit < 0) return 0;
  return Number(profit.toFixed(2));
}

function normalizeBillResults(storedResults) {
  if (!storedResults || typeof storedResults !== "object") return {};

  return Object.entries(storedResults).reduce((acc, [merchantId, value]) => {
    if (Array.isArray(value)) {
      acc[merchantId] = value;
      return acc;
    }

    if (value && typeof value === "object") {
      acc[merchantId] = [{ id: `${merchantId}-legacy`, ...value }];
    }

    return acc;
  }, {});
}

function Merchants() {
  const { merchantsList, deleteMerchant } = useMerchants();
  const navigate = useNavigate();
  const [uploadErrorById, setUploadErrorById] = useState({});
  const [activeUploadMerchantId, setActiveUploadMerchantId] = useState("");
  const [auditResultById, setAuditResultById] = useState(
    () => normalizeBillResults(readJSON(STORAGE_KEYS.BILL_AUDIT_RESULTS))
  );
  const hasMerchants = useMemo(() => merchantsList.length > 0, [merchantsList]);
  const latestAuditResult = useMemo(() => {
    // Flatten all bills and get the one with the most recent `uploaded_at` (or just the very last one added)
    const allBills = Object.values(auditResultById).flat();
    if (allBills.length === 0) return null;
    return allBills[allBills.length - 1]; // Naive approach for "latest"
  }, [auditResultById]);


  const handleBillUpload = async (merchant, file) => {
    if (!file) return;

    setActiveUploadMerchantId(merchant.id);
    setUploadErrorById((prev) => ({ ...prev, [merchant.id]: "" }));

    try {
      const { extractBillTextFromImage } = await import("../utils/billOcr");
      const { text, confidence } = await extractBillTextFromImage(file);
      const previousOutstanding = getPreviousOutstandingFromProfit(merchant);

      if (!Number.isFinite(previousOutstanding) || previousOutstanding < 0) {
        throw new Error("Merchant profit is invalid, cannot derive previous outstanding.");
      }

      const result = auditMerchantBill({
        merchant_id: merchant.id,
        previous_outstanding_amount: previousOutstanding,
        bill_text: text,
        is_image_blurry: confidence < 90,
      });

      const enrichedResult = {
        id: `${merchant.id}-${Date.now()}`,
        ...result,
        ocr_confidence: Number(confidence.toFixed(2)),
        source_file: file.name,
        uploaded_at: new Date().toISOString(),
      };

      setAuditResultById((prev) => {
        const nextBills = [...(prev[merchant.id] || []), enrichedResult];
        const next = { ...prev, [merchant.id]: nextBills };
        writeJSON(STORAGE_KEYS.BILL_AUDIT_RESULTS, next);
        return next;
      });
    } catch (error) {
      setUploadErrorById((prev) => ({
        ...prev,
        [merchant.id]:
          error instanceof Error
            ? error.message
            : "Bill processing failed. Please retry with a clearer image.",
      }));
    } finally {
      setActiveUploadMerchantId("");
    }
  };

  const handleDeleteMerchant = (merchantId) => {
    deleteMerchant(merchantId);
    setUploadErrorById((prev) => {
      const next = { ...prev };
      delete next[merchantId];
      return next;
    });
    setAuditResultById((prev) => {
      const next = { ...prev };
      delete next[merchantId];
      writeJSON(STORAGE_KEYS.BILL_AUDIT_RESULTS, next);
      return next;
    });
  };

  const handleDeleteBill = (merchantId, billId) => {
    setAuditResultById((prev) => {
      const remainingBills = (prev[merchantId] || []).filter((bill) => bill.id !== billId);
      const next = { ...prev };

      if (remainingBills.length > 0) {
        next[merchantId] = remainingBills;
      } else {
        delete next[merchantId];
      }

      writeJSON(STORAGE_KEYS.BILL_AUDIT_RESULTS, next);
      return next;
    });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">

          <div className="flex flex-1 justify-center py-8 px-4 sm:px-8 lg:px-12">
            <div className="flex flex-col max-w-[1200px] w-full gap-8">

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h1 className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold leading-tight">Merchant Management</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-normal leading-normal">Manage merchant accounts and perform automated OCR audits on settlement documents.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/')} className="flex items-center justify-center rounded-lg h-9 px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm gap-2">
                    Back to Home
                  </button>
                  <button onClick={() => navigate('/add-merchant')} className="flex items-center justify-center rounded-lg h-9 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm gap-2">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Merchant
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Merchant Directory</h2>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Merchant Name</th>
                          <th className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Merchant ID</th>
                          <th className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Bank Setup</th>
                          <th className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Previous Outstanding</th>
                          <th className="px-6 py-3 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {hasMerchants ? (
                          merchantsList.map((merchant) => (
                            <tr key={merchant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {merchant.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <Link to={`/merchant/${merchant.id}`}>
                                    <div className="text-slate-900 dark:text-white text-sm font-medium hover:text-primary transition-colors">{merchant.name}</div>
                                  </Link>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-mono">{merchant.id}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[16px] text-slate-400">account_balance</span>
                                  <span className="text-slate-600 dark:text-slate-300 text-sm">{merchant.bank}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-medium">₹{getPreviousOutstandingFromProfit(merchant)}</td>
                              <td className="px-6 py-4 text-right">
                                <label htmlFor={`bill-${merchant.id}`} className="cursor-pointer text-slate-400 hover:text-primary transition-colors mr-3" title="Upload Bill">
                                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                                  <input
                                    id={`bill-${merchant.id}`}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={activeUploadMerchantId === merchant.id}
                                    onChange={(event) => {
                                      const selected = event.target.files?.[0];
                                      void handleBillUpload(merchant, selected);
                                      event.target.value = "";
                                    }}
                                  />
                                </label>
                                <button onClick={() => handleDeleteMerchant(merchant.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete Merchant">
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                                  <span className="material-symbols-outlined text-4xl text-slate-400">storefront</span>
                                </div>
                                <div>
                                  <h3 className="text-slate-900 dark:text-white font-semibold mb-1">No Merchants Yet</h3>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm">Get started by adding a new merchant to the system.</p>
                                </div>
                                <button onClick={() => navigate('/add-merchant')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                                  Add First Merchant
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bill Auditor Status Panel */}
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Bill Auditor (OCR)</h2>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engine v2.4.1</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex flex-col items-center justify-center p-8 h-[320px] cursor-pointer group pointer-events-none">
                      <div className="size-16 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[32px]">upload_file</span>
                      </div>
                      <p className="text-slate-900 dark:text-white text-base font-medium mb-1">Upload settlement document</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Use the upload button in the table above.</p>
                      {activeUploadMerchantId && <p className="mt-4 text-primary animate-pulse text-sm">Processing bill...</p>}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm h-[320px] flex flex-col">
                      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary">analytics</span>
                          <h3 className="text-slate-900 dark:text-white text-sm font-semibold">
                            Latest Audit Result: {latestAuditResult ? latestAuditResult.source_file : "No audits yet"}
                          </h3>
                        </div>
                        {latestAuditResult && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            High Confidence
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex overflow-hidden">
                        {latestAuditResult ? (
                          <>
                            <div className="w-1/2 p-5 border-r border-slate-200 dark:border-slate-800 flex flex-col gap-5 overflow-y-auto bg-slate-50 h-full">
                              <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-slate-600 dark:text-slate-400">Merchant Status</span>
                                  <span className="text-slate-900 dark:text-white font-medium">{latestAuditResult.merchant_status}</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-slate-600 dark:text-slate-400">Total Profit Calc</span>
                                  <span className="text-slate-900 dark:text-white font-medium">₹{latestAuditResult.total_profit?.toFixed(2) || "0.00"}</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-slate-600 dark:text-slate-400">Total Expenses Calc</span>
                                  <span className="text-slate-900 dark:text-white font-medium">₹{latestAuditResult.total_expenses?.toFixed(2) || "0.00"}</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-sm mb-1.5">
                                  <span className="text-slate-600 dark:text-slate-400">OCR Confidence</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${latestAuditResult.ocr_confidence}%` }}></div>
                                </div>
                                <div className="text-right mt-1 text-xs text-slate-500">{latestAuditResult.ocr_confidence}% confidence</div>
                              </div>
                            </div>
                            <div className="w-1/2 bg-white dark:bg-[#0d0914] overflow-y-auto font-mono text-xs p-5 text-slate-600 dark:text-slate-400">
                              <pre><code>{JSON.stringify(latestAuditResult, null, 2)}</code></pre>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
                            Upload a bill using the table above to see audit results here.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      <AgentOverlay />
    </div>
  );
}

export default Merchants;
