import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../assets/assets";

function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={assets.felo} alt="Logo" />
        <span>خدمة شباب</span>
      </div>

      <div className="navbar-toggle" onClick={() => setOpen(!open)}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <ul className={`navbar-links ${open ? "show" : ""}`}>
        <li
          className={location.pathname === "/today-attendance" ? "active" : ""}
        >
          <Link to="/today-attendance">حضور اليوم</Link>
        </li>
        <li
          className={location.pathname === "/most-attendance" ? "active" : ""}
        >
          <Link to="/most-attendance">الأكثر حضورًا</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
