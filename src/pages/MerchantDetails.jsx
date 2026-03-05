import AgentOverlay from "../components/AgentOverlay";

import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";

import { getMerchantById } from "../data";
import AgentTrace from "../components/AgentTrace";
import { calculateSettlement } from "../utils/settlement";
import { STORAGE_KEYS } from "../utils/storage";

import "./MerchantDetails.css";

function MerchantDetails() {
  const { id } = useParams();
  const merchant = useMemo(() => getMerchantById(id), [id]);
  const merchantStatus = useMemo(
    () => localStorage.getItem(STORAGE_KEYS.SETTLEMENT_STATUS) || "WAITING",
    []
  );
  const { total, fees, refunds, netPayable } = useMemo(
    () => calculateSettlement(merchant?.transactions),
    [merchant]
  );

  if (!merchant) {
    return <h2 style={{ padding: "30px" }}>Merchant Not Found</h2>;
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
