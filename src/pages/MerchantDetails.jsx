import AgentOverlay from "../components/AgentOverlay";

import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";

import { useMerchants } from "../context/MerchantContext";
import AgentTrace from "../components/AgentTrace";
import { calculateSettlement } from "../utils/settlement";
import { STORAGE_KEYS } from "../utils/storage";

import "./MerchantDetails.css";

function MerchantDetails() {
  const { id } = useParams();
  const { getMerchantById } = useMerchants();
  const merchant = useMemo(() => getMerchantById(id), [id, getMerchantById]);
  const merchantStatus = useMemo(
    () => localStorage.getItem(STORAGE_KEYS.SETTLEMENT_STATUS) || "WAITING",
    []
  );
  const { total, fees, refunds, netPayable } = useMemo(
    () => calculateSettlement(merchant?.transactions),
    [merchant]
  );

  if (!merchant) {
    return (
      <div className="bg-background-light font-display min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-red-50 p-4 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-red-600">error</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Merchant Not Found</h2>
          <p className="text-slate-500">The merchant could not be located.</p>
          <button onClick={() => window.history.back()} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

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
        <AgentTrace merchantId={merchant.id} merchantStatus={merchantStatus} />
      </div>

      {/* Floating Agent Overlay */}
      <AgentOverlay />

    </div>
  );
}

export default MerchantDetails;
