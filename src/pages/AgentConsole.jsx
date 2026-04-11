import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { readJSON, STORAGE_KEYS } from "../utils/storage";

function AgentConsole() {
  const navigate = useNavigate();

  // Load Agent Output from Overlay
  const result = useMemo(() => readJSON(STORAGE_KEYS.AGENT_RESULT), []);

  if (!result) {
    return (
      <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <span className="material-symbols-outlined text-4xl text-primary">smart_toy</span>
          </div>
          <h2 className="text-2xl font-bold">No Agent Execution Found</h2>
          <p className="text-slate-500 max-w-sm">Start by searching for a merchant in the Command Center to trigger an AI agent workflow.</p>
          <button onClick={() => navigate("/")} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">Return to Command Center</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col antialiased">
      <div className="flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex h-full grow flex-col">
          <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
            <div className="flex flex-col max-w-[960px] w-full flex-1">

              <div className="flex flex-wrap items-center gap-2 mb-6">
                <button onClick={() => navigate('/agent')} className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">AI Agents</button>
                <span className="text-slate-300 text-sm">/</span>
                <span className="text-slate-500 text-sm font-medium">Workflows</span>
                <span className="text-slate-300 text-sm">/</span>
                <span className="text-slate-900 text-sm font-semibold">Execution Trace #{result.merchantId}</span>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div className="flex flex-col gap-2">
                  <h1 className="text-slate-900 text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">AI Agent Console</h1>
                  <p className="text-slate-500 text-base">Review step-by-step reasoning and approve settlement actions.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 text-primary px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Human Approval</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-slate-900 text-lg font-bold mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '24px' }}>chat</span> Original Prompt
                </h3>
                <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm">
                  <div className="flex gap-4 items-start">
                    <div className="bg-indigo-50 p-2 rounded-lg text-primary shrink-0 border border-indigo-100">
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>smart_toy</span>
                    </div>
                    <p className="text-slate-700 text-base leading-relaxed italic">
                      "{result.prompt}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill Audit Summary */}
              {result.billAuditSummary && (
                <div className="mb-8">
                  <h3 className="text-slate-900 text-lg font-bold mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '24px' }}>receipt_long</span> Bill Audit Summary
                  </h3>
                  <div className="bg-surface-light border border-border-light rounded-xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bills Audited</p>
                      <p className="text-2xl font-bold text-slate-900">{result.billAuditSummary.totalBills}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flagged</p>
                      <p className={`text-2xl font-bold ${result.billAuditSummary.flaggedBills > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {result.billAuditSummary.flaggedBills}
                      </p>
                    </div>
                    {result.billAuditSummary.billBasedTotal != null && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bill Total</p>
                        <p className="text-2xl font-bold text-slate-900">₹{result.billAuditSummary.billBasedTotal}</p>
                      </div>
                    )}
                    {result.billAuditSummary.variance != null && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Variance</p>
                        <p className={`text-2xl font-bold ${result.billAuditSummary.variance > result.billAuditSummary.transactionNetPayable * 0.1 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ₹{Number(result.billAuditSummary.variance).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-10 bg-surface-light border border-border-light rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-50 text-primary p-3 rounded-xl border border-indigo-100">
                    <span className="material-symbols-outlined text-3xl" style={{ fontSize: '32px' }}>payments</span>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Calculated Net Payable</p>
                    <p className="text-primary text-4xl md:text-5xl font-black tracking-tight">₹{result.netPayable}</p>
                  </div>
                </div>
                <div className="text-right border-t md:border-t-0 md:border-l border-border-light pt-4 md:pt-0 md:pl-6 w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center">
                  <div>
                    <p className="text-slate-400 text-xs font-medium uppercase">Merchant</p>
                    <p className="text-slate-800 font-semibold">{result.merchantName}</p>
                  </div>
                  <div className="mt-0 md:mt-3">
                    <p className="text-slate-400 text-xs font-medium uppercase">Confidence Score</p>
                    <p className="text-emerald-600 font-bold flex items-center gap-1 justify-end md:justify-end">
                      99.8% <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>verified</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-12 relative pl-4 md:pl-0">
                <h3 className="text-slate-900 text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '24px' }}>timeline</span> AI Execution Trace
                </h3>
                <div className="absolute left-[27px] md:left-[23px] top-14 bottom-0 w-[2px] bg-border-light"></div>
                <div className="flex flex-col gap-6">

                  {result.steps.map((step, i) => (
                    <div key={i} className="flex gap-4 relative z-10">
                      <div className={`w-8 h-8 rounded-full ${i === result.steps.length - 1 ? 'bg-primary text-white ring-4 ring-indigo-50' : 'bg-surface-light border-2 border-slate-300'} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="material-symbols-outlined text-sm" style={{ fontSize: '16px' }}>
                          {i === result.steps.length - 1 ? 'check' : 'rule'}
                        </span>
                      </div>
                      <div className={`${i === result.steps.length - 1 ? 'bg-indigo-50/50 border-indigo-100' : 'bg-surface-light border-border-light'} border rounded-xl p-4 shadow-sm flex-1`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-semibold ${i === result.steps.length - 1 ? 'text-primary' : 'text-slate-900'}`}>{i === result.steps.length - 1 ? 'Workflow Complete' : 'Agent Step'}</h4>
                          <span className={`text-xs ${i === result.steps.length - 1 ? 'text-primary/70' : 'text-slate-400'} font-mono`}>0.{(i + 1) * 2}s</span>
                        </div>
                        <p className={`text-sm ${i === result.steps.length - 1 ? 'text-slate-700' : 'text-slate-600'}`}>{step}</p>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              <div className="sticky bottom-6 mt-auto">
                <div className="bg-surface-light border border-border-light rounded-2xl p-4 shadow-lg shadow-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-slate-500 hidden md:block">
                    Workflow ID: <span className="font-mono text-slate-700">#{result.merchantId}-FLOW</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigate("/")}
                      className="px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span> Cancel Workflow
                    </button>
                    <button
                      onClick={() => navigate(`/approval/${result.merchantId}`)}
                      className="px-6 py-2.5 rounded-lg bg-primary hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified_user</span> Proceed to Approval
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentConsole;
