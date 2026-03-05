import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { merchants } from "../data";
import { logEvent } from "../audit";
import { calculateSettlement } from "../utils/settlement";
import { STORAGE_KEYS } from "../utils/storage";

import "./AgentOverlay.css";

function AgentOverlay() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const normalizedPrompt = prompt.toLowerCase();
  const merchantLookup = useMemo(
    () =>
      merchants.map((merchant) => ({
        merchant,
        normalizedName: merchant.name.toLowerCase(),
      })),
    []
  );

  // ✅ Run Instruction Like Real Bank Copilot
  const handleSubmit = () => {
    setError("");

    if (!prompt.trim()) {
      setError("⚠ Please enter an instruction.");
      return;
    }

    // ✅ Intent Parser (simple prototype)
    const merchantMatch = merchantLookup.find(({ normalizedName }) =>
      normalizedPrompt.includes(normalizedName)
    );
    const merchant = merchantMatch?.merchant;

    if (!merchant) {
      setError("❌ Merchant not found in instruction.");
      return;
    }

    // ✅ Settlement Calculation
    const { netPayable } = calculateSettlement(merchant.transactions);

    // ✅ Agent Execution Trace Output
    const agentResult = {
      prompt,
      merchantId: merchant.id,
      merchantName: merchant.name,
      netPayable,
      steps: [
        "Intent Parsed ✅",
        "Merchant Identified ✅",
        "Transactions Loaded ✅",
        "Net Payable Computed ✅",
        "Risk Flagged: CRITICAL ⚠",
        "Approval Required ⏸",
      ],
    };

    // ✅ Store agent output for Approval Page
    localStorage.setItem(STORAGE_KEYS.AGENT_RESULT, JSON.stringify(agentResult));

    // ✅ Compliance Audit Log
    logEvent({
      event: `Agent prepared settlement draft for ${merchant.name}`,
      level: "MEDIUM",
    });

    // ✅ Close overlay
    setOpen(false);

    // ✅ DIRECT AUTO JUMP TO APPROVAL PAGE
    navigate(`/approval/${merchant.id}`);
  };

  return (
    <div className="overlay-container">
      {/* Floating Copilot Button */}
      <button className="overlay-btn" onClick={() => setOpen(!open)}>
        💬 Agent
      </button>

      {/* Overlay Input Box */}
      {open && (
        <div className="overlay-box">
          <h4>Ask Settlement Agent</h4>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Settle Merchant ABC for last week"
          />

          <button className="run-btn" onClick={handleSubmit}>
            Run Instruction →
          </button>

          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default AgentOverlay;
