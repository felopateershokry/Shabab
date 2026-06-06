import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import "./Footer.css";

const LINKS = [
  { label: "الرئيسية", to: "/" },
  { label: "المخدومين", to: "/list-makhdom" },
  { label: "الخدام", to: "/list-khodam" },
  { label: "لوحة التحكم", to: "/dashboard" },
];

function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <img src={assets.felo} alt="شعار" className="footer-logo" />
          <div className="footer-brand-text">
            <span className="footer-brand-name">سان جيوفاني</span>
            <span className="footer-brand-sub">
              كنيسة أبانوب النهيسي · المندرة
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="footer-nav">
          {LINKS.map((l) => (
            <span
              key={l.to}
              className="footer-nav-item"
              onClick={() => navigate(l.to)}
            >
              {l.label}
            </span>
          ))}
        </nav>

        {/* Right */}
        <div className="footer-right">
          {/* <div className="footer-status">
            <span className="footer-status-dot" />
            يعمل
          </div> */}
          <a
            className="footer-copy"
            href="https://felopateer-shokry.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            © {new Date().getFullYear()} Felopateer Shokry
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
