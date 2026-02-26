import React from "react";
import "./SimulationToggle.css";

function SimulationToggle({ mode, setMode }) {
  return (
    <div className="sim-box">
      <h4>⚙ Agent Simulation Mode</h4>

      <label>
        <input
          type="radio"
          value="SHADOW"
          checked={mode === "SHADOW"}
          onChange={() => setMode("SHADOW")}
        />
        ✅ Shadow Mode (No Execution)
      </label>

      <label>
        <input
          type="radio"
          value="LIVE"
          checked={mode === "LIVE"}
          onChange={() => setMode("LIVE")}
        />
        ⚠ Live Mode (Approval Required)
      </label>

      <p className="sim-note">
        Banks run agents in Shadow Mode first for validation before production.
      </p>
    </div>
  );
}

export default SimulationToggle;
