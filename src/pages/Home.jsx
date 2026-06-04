import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import Navbar from "./../components/Navbar";
import "./Home.css";
import { db } from "../firebase";
import { collection, getCountFromServer } from "firebase/firestore"; // ✅

function Home() {
  const [makhdomCount, setMakhdomCount] = useState(null); // ✅

  // ✅ جلب عدد المخدومين
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const snapshot = await getCountFromServer(collection(db, "makhdom"));
        setMakhdomCount(snapshot.data().count);
      } catch (err) {
        console.error("خطأ في جلب العدد:", err);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="app-container">
      <Navbar />

      <main className="main-content">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <span className="church-badge">
              كنيسة الشهيد العظيم ابانوب النهيسي بالمندرة 🕯️
            </span>
            <h1 className="hero-title">
              اجتماع <span className="highlight">سان جيوفاني</span>
            </h1>
            <p className="hero-subtitle">للشباب</p>
          </div>

          {/* Logo */}
          <div className="logo-wrapper">
            <div className="logo-glow"></div>
            <div className="logo-ring"></div>
            <img src={assets.felo} alt="شعار الكنيسة" className="hero-logo" />
          </div>
        </div>

        {/* Main Menu */}
        <div className="menu-container">
          <Link to="/list-khodam" className="menu-item khodam">
            <div className="menu-icon">👑</div>
            <div className="menu-text">
              <span className="menu-title">الخدام</span>
              <span className="menu-desc">إدارة بيانات الخدم</span>
            </div>
            <div className="menu-arrow">›</div>
          </Link>

          <Link to="/list-makhdom" className="menu-item makhdom">
            <div className="menu-icon">🙌</div>
            <div className="menu-text">
              <span className="menu-title">المخدومين</span>
              <span className="menu-desc">إدارة بيانات المخدومين</span>
            </div>
            {/* ✅ عدد المخدومين */}
            <div className="menu-count">
              {makhdomCount !== null ? makhdomCount : "..."}
            </div>
            <div className="menu-arrow">›</div>
          </Link>

          <Link to="/transfer" className="menu-item transfer">
            <div className="menu-icon">🦅</div>
            <div className="menu-text">
              <span className="menu-title">نسر جنية</span>
              <span className="menu-desc">تحويل نسر جنية</span>
            </div>
            <div className="menu-arrow">›</div>
          </Link>
        </div>

        {/* Scan Action */}
        <div className="scan-section">
          <Link to="/scan" className="scan-btn">
            <div className="scan-content">
              <span>مسح البطاقة</span>
            </div>
            <div className="scan-glow"></div>
          </Link>
        </div>
      </main>

      {/* Background Effects */}
      <div className="bg-gradient"></div>
      <div className="bg-dots"></div>
    </div>
  );
}

export default Home;
