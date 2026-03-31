import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import TopBanner from "./components/TopBanner";
import { MerchantProvider } from "./context/MerchantContext";

const loadHome = () => import("./pages/Home");
const loadMerchants = () => import("./pages/Merchants");
const loadMerchantDetails = () => import("./pages/MerchantDetails");
const loadApproval = () => import("./pages/Approval");
const loadAgentConsole = () => import("./pages/AgentConsole");
const loadAuditLedger = () => import("./pages/AuditLedger");
const loadAddMerchant = () => import("./pages/AddMerchant");

const Home = lazy(loadHome);
const Merchants = lazy(loadMerchants);
const MerchantDetails = lazy(loadMerchantDetails);
const Approval = lazy(loadApproval);
const AgentConsole = lazy(loadAgentConsole);
const AuditLedger = lazy(loadAuditLedger);
const AddMerchant = lazy(loadAddMerchant);

function App() {
  useEffect(() => {
    const prefetchRoutes = () => {
      void loadHome();
      void loadMerchants();
      void loadMerchantDetails();
      void loadApproval();
      void loadAgentConsole();
      void loadAuditLedger();
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetchRoutes);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(prefetchRoutes, 1200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <MerchantProvider>
      <BrowserRouter>
        {/* ✅ Top Navigation */}
        <Navbar />

        {/* ✅ Compliance Banner */}
        <TopBanner />

        {/* ✅ Routes */}
        <Suspense fallback={<div style={{ padding: "20px" }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="/merchant/:id" element={<MerchantDetails />} />
            <Route path="/approval/:id" element={<Approval />} />
            <Route path="/agent" element={<AgentConsole />} />
            <Route path="/ledger" element={<AuditLedger />} />
            <Route path="/logs" element={<AuditLedger />} />
            <Route path="/add-merchant" element={<AddMerchant />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </MerchantProvider>
  );
}

export default App;
