import React from "react";
import { auditLedger } from "../audit";
import "./AuditLedger.css";

function AuditLedger() {
  return (
    <div className="ledger-page">
      <h2>📌 Immutable Audit Event Timeline</h2>

      {auditLedger.length === 0 ? (
        <p className="empty">No compliance events recorded yet.</p>
      ) : (
        <div className="timeline">
          {auditLedger.map((log, index) => (
            <div key={index} className="timeline-event">
              <div className="time">{log.time}</div>

              <div className="event">
                {log.event}
                <span className="level">({log.level})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="note">
        🔒 Logs are append-only and tamper-resistant for regulated compliance.
      </p>
    </div>
  );
}

export default AuditLedger;
