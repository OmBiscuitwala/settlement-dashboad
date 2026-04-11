import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h2 className="logo">Merchant Settlement Ops</h2>
      </Link>
      <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Link to="/merchants" className="nav-link">Merchants</Link>
        <Link to="/bills" className="nav-link">Bills</Link>
        <Link to="/ledger" className="nav-link">Audit Log</Link>
      </nav>
    </div>
  );
}

export default Navbar;
