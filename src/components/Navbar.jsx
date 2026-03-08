import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../assets/assets";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <img src={assets.felo} alt="logo" />
          <span>خدمة شباب</span>
        </div>

        {/* Hamburger */}
        <div
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Links */}
        <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li className={location.pathname === "/" ? "active" : ""}>
            <Link onClick={closeMenu} to="/">
              الرئيسية
            </Link>
          </li>

          <li
            className={
              location.pathname === "/today-attendance" ? "active" : ""
            }
          >
            <Link onClick={closeMenu} to="/today-attendance">
              حضور اليوم
            </Link>
          </li>

          <li
            className={location.pathname === "/most-attendance" ? "active" : ""}
          >
            <Link onClick={closeMenu} to="/most-attendance">
              الأكثر حضورًا
            </Link>
          </li>
          <li>
            <Link onClick={closeMenu} to="/month-attendance" className="disable">
              حضور الشهر
            </Link>
          </li>
        </ul>

        {/* Button */}
        <div className="navbar-button">
          <button onClick={() => navigate("/month-attendance")}>حضور الشهر</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
