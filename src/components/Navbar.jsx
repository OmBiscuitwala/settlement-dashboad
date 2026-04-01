import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h2 className="logo">Merchant Settlement Ops</h2>
      </Link>
    </div>
  );
}

export default Navbar;
