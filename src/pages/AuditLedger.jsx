import React, { useEffect, useState } from "react";
import { auditLedger } from "../audit";
import { getAllAuditLogs } from "../utils/billDatabase";
import "./AuditLedger.css";

function AuditLedger() {
  // Start with in-memory session entries so nothing disappears during a session
  const [logs, setLogs] = useState([...auditLedger]);

  useEffect(() => {
    getAllAuditLogs()
      .then((dbLogs) => {
        // Merge DB logs with current session logs (deduplicate by id/time+event)
        const sessionIds = new Set(auditLedger.map((l) => `${l.event}|${l.time}`));
        const uniqueDbLogs = dbLogs.filter(
          (l) => !sessionIds.has(`${l.event}|${l.time}`)
        );
        setLogs([...uniqueDbLogs, ...auditLedger]);
      })
      .catch(() => {
        // If IndexedDB read fails, fall back to in-memory ledger
        setLogs([...auditLedger]);
      });
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen">
      <div className="p-6 md:p-8 lg:p-12 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-3xl text-primary">timeline</span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Audit Event Timeline</h2>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-xl">
                <span className="material-symbols-outlined text-4xl text-slate-400">history</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No Compliance Events Yet</h3>
                <p className="text-slate-500 dark:text-slate-400">System audit logs will appear here as you perform operations.</p>
              </div>
            </div>
          </div>
        ) : (
        <div className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-4 p-4 border-b last:border-b-0 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap pt-0.5">
                {log.time}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <p className="text-slate-900 dark:text-white text-sm">{log.event}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  log.level === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                  log.level === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                  log.level === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>{log.level}</span>
              </div>
            </div>
          ))}
        </div>
      )}

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 justify-center">
          <span className="material-symbols-outlined text-sm">lock</span>
          Logs are immutable and tamper-resistant for regulatory compliance
        </p>
      </div>
    </div>
  );
}

export default AuditLedger;
