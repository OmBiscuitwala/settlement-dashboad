import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { merchants } from "../data";
import { logEvent } from "../audit";
import { STORAGE_KEYS } from "../utils/storage";
import { runSettlementWorkflow } from "../utils/agentEngine";

import "./AgentOverlay.css";

function AgentOverlay() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenAgent = (e) => {
      setOpen(true);
      if (e.detail?.prompt) {
        setPrompt(e.detail.prompt);
      }
    };
    window.addEventListener("OPEN_AGENT", handleOpenAgent);
    return () => window.removeEventListener("OPEN_AGENT", handleOpenAgent);
  }, []);

  // Detect simulation mode from localStorage (set by SimulationToggle)
  const getMode = () =>
    localStorage.getItem("simulationMode") === "SHADOW" ? "SHADOW" : "LIVE";

  // ✅ Run Instruction via rule-based agent pipeline
  const handleSubmit = async () => {
    setError("");

    if (!prompt.trim()) {
      setError("⚠ Please enter an instruction.");
      return;
    }

    setRunning(true);

    try {
      const agentResult = await runSettlementWorkflow(
        prompt,
        merchants,
        getMode()
      );

      if (agentResult.error) {
        setError(agentResult.error);
        setRunning(false);
        return;
      }

      // ✅ Store agent output for AgentConsole / Approval page
      localStorage.setItem(
        STORAGE_KEYS.AGENT_RESULT,
        JSON.stringify(agentResult)
      );

      // ✅ Compliance Audit Log (in-memory + IndexedDB via logEvent)
      logEvent({
        event: `Agent prepared settlement draft for ${agentResult.merchantName}`,
        level: "MEDIUM",
      });

      setOpen(false);
      navigate(`/approval/${agentResult.merchantId}`);
    } catch (err) {
      setError("❌ Agent workflow failed: " + err.message);
    } finally {
      setRunning(false);
    }
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
            disabled={running}
          />

          <button
            className="run-btn"
            onClick={handleSubmit}
            disabled={running}
          >
            {running ? "Running…" : "Run Instruction →"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default AgentOverlay;
