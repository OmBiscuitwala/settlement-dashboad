import React from "react";
import { useNavigate } from "react-router-dom";

import "./AgentConsole.css";

function AgentConsole() {
  const navigate = useNavigate();

  // ✅ Load Agent Output from Overlay
  const result = JSON.parse(localStorage.getItem("agentResult"));

  if (!result) {
    return <h2 style={{ padding: "30px" }}>No Agent Execution Found</h2>;
  }

  return (
    <div className="agent-page">
      <h2>🤖 AI Settlement Agent Console</h2>

      <div className="agent-card">
        <p>
          <b>User Prompt:</b> {result.prompt}
        </p>

        <hr />

        <p>
          <b>Merchant Identified:</b> {result.merchantName}
        </p>

        <p>
          <b>Net Payable Calculated:</b> ₹{result.netPayable}
        </p>

        <h3>Execution Trace</h3>

        <ul>
          {result.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>

        <button
          className="confirm-btn"
          onClick={() => navigate(`/approval/${result.merchantId}`)}
        >
          ✅ Proceed to Human Approval
        </button>

        <button className="back-btn" onClick={() => navigate("/")}>
          ❌ Cancel Workflow
        </button>
      </div>
    </div>
  );
}

export default AgentConsole;
