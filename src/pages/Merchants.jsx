import React from "react";
import AgentOverlay from "../components/AgentOverlay";
import { merchants } from "../data";
import { Link } from "react-router-dom";
import "./Merchants.css";

function Merchants() {
  return (
    <div className="page">
      <h2>Merchants Pending Settlement</h2>

      <div className="grid">
        {merchants.map((m) => (
          <div key={m.id} className="card">
            <h3>{m.name}</h3>
            <p><b>ID:</b> {m.id}</p>
            <p><b>Bank:</b> {m.bank}</p>

            <Link to={`/merchant/${m.id}`}>
              <button className="btn">View Settlement →</button>
            </Link>
          </div>
        ))}
      </div>
      <AgentOverlay />
    </div>
  );
}

export default Merchants;
