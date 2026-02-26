import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuditLedger from "./pages/AuditLedger";

import Navbar from "./components/Navbar";
import TopBanner from "./components/TopBanner";

import Merchants from "./pages/Merchants";
import MerchantDetails from "./pages/MerchantDetails";
import Approval from "./pages/Approval";

import AgentConsole from "./pages/AgentConsole";

function App() {
  return (
    <BrowserRouter>
      {/* ✅ Top Navigation */}
      <Navbar />

      {/* ✅ Compliance Banner */}
      <TopBanner />

      {/* ✅ Routes */}
      <Routes>
        <Route path="/" element={<Merchants />} />
        <Route path="/merchant/:id" element={<MerchantDetails />} />
        <Route path="/approval/:id" element={<Approval />} />
      
        <Route path="/agent" element={<AgentConsole />} />
        <Route path="/ledger" element={<AuditLedger />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
