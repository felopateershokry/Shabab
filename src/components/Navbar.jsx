import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../assets/assets";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  // تأثير scroll على الـ navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // إغلاق المنيو لو ضغط برا
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(".navbar")) closeMenu();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // إغلاق المنيو لما يتغير الـ route
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  const navLinks = [
    { to: "/", label: "الرئيسية" },
    { to: "/today-attendance", label: "حضور اليوم" },
    { to: "/most-attendance", label: "الأكثر حضوراً" },
    { to: "/month-attendance", label: "حضور الشهر" },
    { to: "/dashboard", label: "لوحة التحكم" },
  ];

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      {/* خط متحرك أسفل الـ navbar */}
      <div className="navbar-progress" />

      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <div className="logo-img-wrapper">
            <img src={assets.felo} alt="logo" />
          </div>
          <div className="logo-text">
            <span className="logo-title">خدمة شباب</span>
            <span className="logo-sub">سان جيوفاني</span>
          </div>
        </div>

        {/* Desktop Links */}
        <ul className="nav-links-desktop">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={location.pathname === link.to ? "active" : ""}
              >
                {link.label}
                {location.pathname === link.to && (
                  <span className="active-dot" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA Button - desktop */}
        <div className="navbar-cta">
          <button onClick={() => navigate("/scan")} className="scan-cta-btn">
            <span className="scan-pulse" />
            مسح البطاقة
          </button>
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? "active" : ""}`}
          onClick={toggleMenu}
          aria-label="القائمة"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <ul className="mobile-links">
          {navLinks.map((link, i) => (
            <li
              key={link.to}
              style={{ animationDelay: `${i * 0.06}s` }}
              className={menuOpen ? "slide-in" : ""}
            >
              <Link
                to={link.to}
                className={location.pathname === link.to ? "active" : ""}
                onClick={closeMenu}
              >
                <span className="mobile-link-dot" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="mobile-scan-btn"
          onClick={() => {
            navigate("/scan");
            closeMenu();
          }}
        >
          مسح البطاقة
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
