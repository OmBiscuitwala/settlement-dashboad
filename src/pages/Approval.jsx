import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

import { getMerchantById } from "../data";
import { logEvent } from "../audit";
import { generateSettlementPDF } from "../utils/reportGenerator";
import { calculateSettlement, getBlockedReason } from "../utils/settlement";
import { STORAGE_KEYS } from "../utils/storage";

import SimulationToggle from "../components/SimulationToggle";

import "./Approval.css";

function Approval() {
  const { id } = useParams();
  const merchant = useMemo(() => getMerchantById(id), [id]);
  const { netPayable } = useMemo(
    () => calculateSettlement(merchant?.transactions),
    [merchant]
  );
  const blockedReason = useMemo(
    () => (merchant ? getBlockedReason(merchant, netPayable) : ""),
    [merchant, netPayable]
  );

  const [status, setStatus] = useState("");

  // ✅ Simulation Mode State
  const [mode, setMode] = useState("SHADOW");

  if (!merchant) {
    return <h2 style={{ padding: "30px" }}>Merchant Not Found</h2>;
  }

  // =====================================================
  // ✅ Approve Handler (Simulation + Live Execution)
  // =====================================================
  const handleApprove = async () => {
    // 🚫 Block execution if risk issue exists
    if (blockedReason) {
      setStatus("⚠ Cannot execute settlement: " + blockedReason);
      return;
    }

    // ✅ Shadow Mode = No Execution
    if (mode === "SHADOW") {
      logEvent({
        event: `Shadow Mode Validation Complete for ${merchant.name}`,
        level: "LOW",
      });

      setStatus("✅ Shadow Mode Active — No payout executed.");
      return;
    }

    // ✅ Live Mode Execution
    localStorage.setItem(STORAGE_KEYS.SETTLEMENT_STATUS, "APPROVED");

    logEvent({
      event: `Settlement Approved by OpsManager for ${merchant.name}`,
      level: "CRITICAL",
    });

    await generateSettlementPDF(merchant, netPayable);

    setStatus("✅ Settlement Approved & Executed Successfully!");
  };

  // =====================================================
  // ❌ Reject Handler
  // =====================================================
  const handleReject = () => {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENT_STATUS, "REJECTED");

    logEvent({
      event: `Settlement Rejected — Workflow Stopped for ${merchant.name}`,
      level: "HIGH",
    });

    setStatus("❌ Settlement Rejected. No payout executed.");
  };

  return (
    <div className="approval-page">
      <h2>Settlement Approval Gate</h2>

      <div className="approval-card">
        {/* Merchant Info */}
        <p>
          <b>Merchant:</b> {merchant.name}
        </p>
        <p>
          <b>Merchant ID:</b> {merchant.id}
        </p>
        <p>
          <b>Bank Account:</b> {merchant.bank}
        </p>

        <hr />

        {/* Amount */}
        <p className="amount">
          Net Payable Amount: ₹{netPayable}
        </p>

        {/* Risk */}
        <p className="risk">
          Risk Level:{" "}
          <span>
            {blockedReason ? "BLOCKED" : "CRITICAL — Human Approval Required"}
          </span>
        </p>

        {/* ⚠ Block Banner */}
        {blockedReason && (
          <div className="blocked-box">
            ⚠ Settlement Blocked — Reason: {blockedReason}
          </div>
        )}

        {/* ✅ Simulation Mode Toggle */}
        <SimulationToggle mode={mode} setMode={setMode} />

        {/* Buttons */}
        <div className="btn-group">
          <button
            className="btn approve"
            onClick={handleApprove}
            disabled={blockedReason}
          >
            {mode === "SHADOW"
              ? "✅ Run Shadow Validation"
              : "✅ Approve & Execute Settlement"}
          </button>

          <button className="btn reject" onClick={handleReject}>
            ❌ Reject Settlement
          </button>
        </div>

        {/* PDF Download */}
        <button
          className="btn back"
          onClick={() => {
            void generateSettlementPDF(merchant, netPayable);
          }}
        >
          📄 Download Settlement Report
        </button>

        {/* Status */}
        {status && <h3 className="status">{status}</h3>}
      </div>

      {/* Back */}
      <Link to="/">
        <button className="btn back">← Back to Merchants</button>
      </Link>
    </div>
  );
}

export default Approval;
