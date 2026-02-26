import AgentOverlay from "../components/AgentOverlay";

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import { merchants } from "../data";
import AgentTrace from "../components/AgentTrace";

import "./MerchantDetails.css";

function MerchantDetails() {
  const { id } = useParams();
  const merchant = merchants.find((m) => m.id === id);

  // ✅ Workflow Status (WAITING / APPROVED / REJECTED)
  const [status, setStatus] = useState("WAITING");

  // ✅ Load saved status after approval/rejection
  useEffect(() => {
    const saved = localStorage.getItem("settlementStatus");
    if (saved) {
      setStatus(saved);
    }
  }, []);

  if (!merchant) {
    return <h2 style={{ padding: "30px" }}>Merchant Not Found</h2>;
  }

  // ✅ Settlement Calculation
  const total = merchant.transactions.reduce((sum, t) => sum + t.amount, 0);
  const fees = merchant.transactions.reduce((sum, t) => sum + t.fee, 0);
  const refunds = merchant.transactions.reduce((sum, t) => sum + t.refund, 0);

  const netPayable = total - fees - refunds;

  return (
    <div className="bank-layout">
      {/* LEFT COLUMN */}
      <div className="left-panel">
        <h3>Merchant Info</h3>

        <p>
          <b>Name:</b> {merchant.name}
        </p>
        <p>
          <b>ID:</b> {merchant.id}
        </p>
        <p>
          <b>Bank:</b> {merchant.bank}
        </p>

        <div className="risk-box">
          Risk Level: <span>HIGH</span>
        </div>
      </div>

      {/* CENTER COLUMN */}
      <div className="center-panel">
        <h2>Settlement Transactions</h2>

        <table className="txn-table">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Refund</th>
            </tr>
          </thead>

          <tbody>
            {merchant.transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>₹{t.amount}</td>
                <td>₹{t.fee}</td>
                <td>₹{t.refund}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Settlement Summary */}
        <div className="summary-box">
          <p>
            <b>Total:</b> ₹{total}
          </p>
          <p>
            <b>Fees:</b> ₹{fees}
          </p>
          <p>
            <b>Refunds:</b> ₹{refunds}
          </p>

          <hr />

          <h3 className="net">Net Payable: ₹{netPayable}</h3>
        </div>

        {/* Approval Button */}
        <Link to={`/approval/${merchant.id}`}>
          <button className="btn green">Proceed to Approval →</button>
        </Link>
      </div>

      {/* RIGHT COLUMN */}
      <div className="right-panel"> 
        <AgentTrace merchantId={merchant.id} /> 
      </div>

       {/* Floating Agent Overlay */}
      <AgentOverlay />

    </div>
  );
}

export default MerchantDetails;
