import React from "react";
import "./AgentTrace.css";

function AgentTrace({ merchantId, merchantStatus }) {
  return (
    <div className="agent-trace">
      <h3>🤖 Agent Execution Trace</h3>

      {/* User Request */}
      <div className="trace-section">
        <p className="trace-title">User Request:</p>
        <p className="trace-box">
          “Settle Merchant {merchantId} for last week”
        </p>
      </div>

      {/* Parsed Intent */}
      <div className="trace-section">
        <p className="trace-title">Parsed Intent:</p>

        <pre className="trace-code">
{`{
  "merchant_id": "${merchantId}",
  "period": "last_week",
  "action": "prepare_settlement"
}`}
        </pre>
      </div>

      {/* Planned Steps */}
      <div className="trace-section">
        <p className="trace-title">Planned Steps:</p>

        <ul className="trace-steps">
          <li>
            Fetch transactions ✅ <span>(LOW)</span>
          </li>
          <li>
            Compute net payable ✅ <span>(MEDIUM)</span>
          </li>
          <li>
            Verify bank account ✅ <span>(HIGH)</span>
          </li>
          <li className="critical">
            Execute payout ⏸ <span>(CRITICAL — Approval Required)</span>
          </li>
        </ul>
      </div>

      {/* Current State */}
      <div className="trace-section">
        <p className="trace-title">Current State:</p>

        {merchantStatus === "WAITING" && (
          <p className="waiting">
            ⏸ Waiting for Human Confirmation…
          </p>
        )}

        {merchantStatus === "APPROVED" && (
          <p className="approved">
            ✅ Settlement Executed Successfully
          </p>
        )}

        {merchantStatus === "REJECTED" && (
          <p className="rejected">
            ❌ Workflow Stopped — Settlement Rejected
          </p>
        )}
      </div>
    </div>
  );
}

export default AgentTrace;
