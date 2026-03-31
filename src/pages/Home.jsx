import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { merchants } from "../data";
import { logEvent } from "../audit";
import { calculateSettlement } from "../utils/settlement";
import { STORAGE_KEYS } from "../utils/storage";
import "./Home.css";

function Home() {
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const merchantLookup = useMemo(
        () =>
            merchants.map((merchant) => ({
                merchant,
                normalizedName: merchant.name.toLowerCase(),
            })),
        []
    );

    const handleSearch = (e) => {
        e.preventDefault();
        setError("");

        if (!query.trim()) {
            setError("⚠ Please enter an instruction.");
            return;
        }

        const normalizedQuery = query.toLowerCase();
        const merchantMatch = merchantLookup.find(({ normalizedName }) =>
            normalizedQuery.includes(normalizedName)
        );
        const merchant = merchantMatch?.merchant;

        if (!merchant) {
            setError("❌ Merchant not found in instruction.");
            return;
        }

        const { netPayable } = calculateSettlement(merchant.transactions);

        const agentResult = {
            prompt: query,
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

        localStorage.setItem(STORAGE_KEYS.AGENT_RESULT, JSON.stringify(agentResult));
        logEvent({
            event: `Agent prepared settlement draft for ${merchant.name}`,
            level: "MEDIUM",
        });

        navigate("/agent");
    };

    return (
        <div className="bg-main-bg text-slate-900 font-display min-h-screen">
            <div className="relative flex h-screen w-full flex-col group/design-root overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 overflow-y-auto bg-main-bg p-8 lg:p-12">
                        <div className="max-w-4xl mx-auto flex flex-col gap-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-[-0.033em]">Command Center</h1>
                                <p className="text-slate-500 text-base font-normal leading-normal">Overview of your settlement operations and quick actions.</p>
                            </div>

                            <form onSubmit={handleSearch} className="relative group">
                                <div className="relative flex items-center bg-white rounded-xl border border-primary/20 p-2 shadow-[0_0_15px_rgba(79,70,229,0.1)] hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] transition-shadow duration-300 @container">
                                    <div className="pl-4 text-primary">
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>magic_button</span>
                                    </div>
                                    <input
                                        className="w-full bg-transparent border-none text-slate-900 px-4 py-3 focus:ring-0 outline-none placeholder:text-slate-400 text-lg font-medium"
                                        placeholder="Find merchants with high risk..."
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
                                            disabled={!query.trim()}
                                            className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hidden @[480px]:block"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                                {error && <p className="text-red-500 text-sm mt-3 ml-2 font-medium bg-red-50 px-3 py-1.5 rounded-md self-start border border-red-100">{error}</p>}
                            </form>

                            <div className="flex flex-col gap-4 mt-4">
                                <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-[-0.015em]">Quick Actions</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => navigate('/merchants')}
                                        className="flex flex-col items-start gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-primary/40 transition-all hover:shadow-md hover:shadow-primary/5 text-left group"
                                    >
                                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>storefront</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-semibold text-lg">View Merchants</h3>
                                            <p className="text-slate-500 text-sm mt-1">Manage and monitor active merchant accounts.</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/logs')}
                                        className="flex flex-col items-start gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-warning/40 transition-all hover:shadow-md hover:shadow-warning/5 text-left group"
                                    >
                                        <div className="p-3 rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>history</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-semibold text-lg">View Audit Logs</h3>
                                            <p className="text-slate-500 text-sm mt-1">Review system changes and transaction history.</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/agent')}
                                        className="flex flex-col items-start gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-primary/40 transition-all hover:shadow-md hover:shadow-primary/5 text-left group relative overflow-hidden"
                                    >
                                        <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors relative z-10">
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>smart_toy</span>
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-slate-900 font-semibold text-lg">AI Agent Console</h3>
                                            <p className="text-slate-500 text-sm mt-1">Configure automated settlement workflows.</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/add-merchant')}
                                        className="flex flex-col items-start gap-4 p-6 rounded-xl border border-slate-200 bg-white hover:border-success/40 transition-all hover:shadow-md hover:shadow-success/5 text-left group"
                                    >
                                        <div className="p-3 rounded-lg bg-success/10 text-success group-hover:bg-success group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>person_add</span>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-900 font-semibold text-lg">Add Merchant</h3>
                                            <p className="text-slate-500 text-sm mt-1">Onboard a new merchant to the platform.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default Home;
