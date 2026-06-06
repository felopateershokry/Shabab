import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p className="footer-text">
        © 2026{" "}
        <a
          href="https://felopateer-shokry.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          اجتماع سان جيوفاني للشباب
        </a>{" "}
        — جميع الحقوق محفوظة ✦
      </p>
    </footer>
  );
};

export default Footer;
