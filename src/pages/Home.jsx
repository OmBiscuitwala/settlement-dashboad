import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMerchants } from "../context/MerchantContext";
import { logEvent } from "../audit";
import { runSettlementWorkflow } from "../utils/agentEngine";
import { STORAGE_KEYS, writeJSON } from "../utils/storage";
import "./Home.css";

function Home() {
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const [running, setRunning] = useState(false);
    const [liveSteps, setLiveSteps] = useState([]);
    const navigate = useNavigate();
    const { merchantsList } = useMerchants();

    const handleSearch = async (e) => {
        e.preventDefault();
        setError("");
        setLiveSteps([]);

        if (!query.trim()) {
            setError("⚠ Please enter an instruction.");
            return;
        }

        setRunning(true);

        try {
            const agentResult = await runSettlementWorkflow(
                query,
                merchantsList,
                "LIVE",
                (step) => setLiveSteps((prev) => [...prev, step])
            );

            if (agentResult.error) {
                setError(agentResult.error);
                return;
            }

            writeJSON(STORAGE_KEYS.AGENT_RESULT, agentResult);
            logEvent({
                event: `Agent prepared settlement draft for ${agentResult.merchantName}`,
                level: "MEDIUM",
            });

            navigate("/agent");
        } catch (err) {
            setError("❌ Agent workflow failed: " + err.message);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="bg-bg-main text-slate-900 font-display min-h-screen">
            <div className="relative min-h-[calc(100vh-60px)] w-full overflow-hidden flex flex-col">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-20 left-0 w-72 h-72 bg-purple-300/10 rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-300/5 rounded-full blur-3xl"></div>
                </div>

                <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-12">
                    <div className="max-w-5xl mx-auto flex flex-col gap-12">
                        <div className="flex flex-col gap-4 pt-8">
                            <div className="inline-flex items-center gap-2 w-fit px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                                <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
                                <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI-Powered</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tighter">
                                <span className="text-slate-900">Merchant</span>
                                <br />
                                <span className="text-gradient">Settlement</span>
                                <br />
                                <span className="text-slate-900">Control</span>
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 max-w-3xl leading-relaxed font-medium">
                                Automate complex settlement operations with intelligent AI agents. Analyze merchants, calculate payables, and approve transactions in seconds.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="relative group w-full">
                            <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 p-3 shadow-xl hover:shadow-2xl transition-all duration-300 glow-primary @container">
                                <div className="pl-4 text-primary opacity-60">
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>magic_button</span>
                                </div>
                                <input
                                    className="w-full bg-transparent border-none text-slate-900 px-4 py-4 focus:outline-none placeholder:text-slate-400 text-base font-medium transition-all"
                                    placeholder="Example: 'Settle Merchant ABC Store' or 'Find high-risk merchants'..."
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <div className="flex items-center gap-2 pr-2">
                                    <button type="button" className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-50">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mic</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!query.trim() || running}
                                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hidden @[540px]:flex"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                                        {running ? "Running…" : "Run"}
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <div className="mt-4 flex gap-3 items-start px-4 py-3 bg-danger/10 rounded-lg border border-danger/30 animate-slideUp">
                                    <span className="material-symbols-outlined text-danger flex-shrink-0 mt-0.5" style={{ fontSize: '20px' }}>error_outline</span>
                                    <p className="text-danger font-medium text-sm">{error}</p>
                                </div>
                            )}
                            {running && liveSteps.length > 0 && (
                                <div className="mt-4 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Agent Running…</p>
                                    <ul className="flex flex-col gap-1">
                                        {liveSteps.map((step, i) => (
                                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                                                <span className="material-symbols-outlined text-primary shrink-0" style={{ fontSize: '16px' }}>chevron_right</span>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                            <button
                                onClick={() => navigate('/merchants')}
                                className="group flex flex-col items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all duration-300 text-left"
                            >
                                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>storefront</span>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-semibold text-lg">View Merchants</h3>
                                    <p className="text-slate-500 text-sm mt-1">Manage and monitor all active merchant accounts</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/ledger')}
                                className="group flex flex-col items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-warning/40 hover:shadow-lg transition-all duration-300 text-left"
                            >
                                <div className="p-3 rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>timeline</span>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-semibold text-lg">View Audit Logs</h3>
                                    <p className="text-slate-500 text-sm mt-1">Review system changes and transaction history</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/agent')}
                                className="group flex flex-col items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-lg transition-all duration-300 text-left"
                            >
                                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>smart_toy</span>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-semibold text-lg">AI Agent Console</h3>
                                    <p className="text-slate-500 text-sm mt-1">Manage automated settlement workflows</p>
                                </div>
                            </button>

                            <button
                                onClick={() => navigate('/add-merchant')}
                                className="group flex flex-col items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 hover:border-success/40 hover:shadow-lg transition-all duration-300 text-left"
                            >
                                <div className="p-3 rounded-lg bg-success/10 text-success group-hover:bg-success group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>person_add</span>
                                </div>
                                <div>
                                    <h3 className="text-slate-900 font-semibold text-lg">Add Merchant</h3>
                                    <p className="text-slate-500 text-sm mt-1">Onboard a new merchant to the platform</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Home;
