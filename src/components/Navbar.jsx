import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">
      <h2 className="logo">Merchant Settlement Ops</h2>

     <div className="nav-links">
  <Link to="/">Merchants</Link>
  <Link to="/logs">Audit Logs</Link>
  <Link to="/ledger">Audit Ledger</Link>
  <Link to="/agent" className="hover:text-gray-300">
  

  AI Agent
</Link>

</div>

    </div>
  );
}

export default Navbar;
