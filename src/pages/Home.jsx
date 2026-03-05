import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
    const [query, setQuery] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            // In a real app, this would send the query to an AI backend
            console.log("AI Query:", query);
            setQuery("");
            // For now, we just mock a quick action
            alert(`AI received your request: "${query}". Processing...`);
        }
    };

    const quickCommands = [
        { label: "View Existing Merchants", path: "/merchants", icon: "👥" },
        { label: "View Audit Logs", path: "/logs", icon: "📋" },
        { label: "AI Agent Console", path: "/agent", icon: "🤖" },
    ];

    return (
        <div className="home-container">
            <div className="home-content">
                <h1 className="home-title">Welcome to Settlement Ops</h1>
                <p className="home-subtitle">What would you like to do today?</p>

                <div className="quick-commands">
                    {quickCommands.map((cmd, idx) => (
                        <button
                            key={idx}
                            className="quick-cmd-btn"
                            onClick={() => navigate(cmd.path)}
                        >
                            <span className="cmd-icon">{cmd.icon}</span>
                            {cmd.label}
                        </button>
                    ))}
                    {/* Add a direct action button as well */}
                    <button
                        className="quick-cmd-btn action-cmd"
                        onClick={() => alert("Add Merchant form coming soon!")}
                    >
                        <span className="cmd-icon">➕</span>
                        Add Merchant
                    </button>
                </div>

                <div className="ai-chat-box">
                    <form onSubmit={handleSearch} className="ai-form">
                        <span className="ai-icon">✨</span>
                        <input
                            type="text"
                            className="ai-input"
                            placeholder="Ask the AI to perform a task (e.g., 'Find merchants with high risk')"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" className="ai-submit-btn" disabled={!query.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Home;
