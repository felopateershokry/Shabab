import React, { useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import Navbar from "./../components/Navbar";
import "./Home.css";
import { db } from "../firebase";
import { collection, getCountFromServer } from "firebase/firestore";

// ─── Particle Canvas ───────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles — golden dust + small violet orbs
    const particles = Array.from({ length: 55 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      speedY: -(Math.random() * 0.35 + 0.1),
      speedX: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.5 + 0.1,
      color:
        i % 7 === 0
          ? `rgba(156,111,228,` // violet
          : i % 9 === 0
            ? `rgba(79,195,247,` // cyan
            : `rgba(201,168,76,`, // gold
      phase: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now() / 1000;
      particles.forEach((p) => {
        const flicker = 0.5 + 0.5 * Math.sin(now * 1.5 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${(p.opacity * flicker).toFixed(2)})`;
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="particle-canvas" />;
}

// ─── Main Home ─────────────────────────────────────────────────────────────
function Home() {
  const [makhdomCount, setMakhdomCount] = useState(null);

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

  const menuItems = [
    {
      to: "/list-khodam",
      cls: "khodam",
      icon: "👑",
      title: "الخدام",
      desc: "إدارة بيانات الخدم",
      extra: null,
    },
    {
      to: "/list-makhdom",
      cls: "makhdom",
      icon: "🙌",
      title: "المخدومين",
      desc: "إدارة بيانات المخدومين",
      extra: (
        <div className="menu-count">
          {makhdomCount !== null ? makhdomCount : "·"}
        </div>
      ),
    },
    {
      to: "/transfer",
      cls: "transfer",
      icon: "🦅",
      title: "نسر جنية",
      desc: "تحويل نسر جنية",
      extra: null,
    },
  ];

  return (
    <div className="app-container">
      {/* Layered atmosphere */}
      <ParticleCanvas />
      <div className="atmo-layer radials" />
      <div className="atmo-layer noise" />
      <div className="atmo-layer vignette" />
      <div className="scanlines" />

      <Navbar />

      <main className="main-content">
        {/* ── HERO ─────────────────────────── */}
        <div className="hero-section">
          {/* Church badge */}
          <span className="church-badge">
            <span className="badge-dot" />
            كنيسة الشهيد العظيم أبانوب النهيسي بالمندرة
          </span>

          {/* Logo with orbiting rings */}
          <div className="logo-wrapper">
            <div className="logo-glow" />
            <div className="logo-orbit" />
            <div className="logo-orbit-2" />
            <img src={assets.felo} alt="شعار الكنيسة" className="hero-logo" />
          </div>

          {/* Titles */}
          <div className="hero-content">
            <span className="hero-eyebrow">✦ اجتماع</span>
            <h1 className="hero-title">
              <span className="title-line-1">سان جيوفاني</span>
              <span className="title-accent">للشباب</span>
            </h1>
          </div>
        </div>

        {/* ── GOLD DIVIDER ─────────────────── */}
        <div className="gold-divider">
          <span className="gold-divider-line" />
          <span className="gold-divider-icon">✦</span>
          <span className="gold-divider-line" />
        </div>

        {/* ── MENU CARDS ───────────────────── */}
        <nav className="menu-container">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`menu-item ${item.cls}`}
            >
              <div className="menu-icon-wrap">
                <div className="menu-icon-bg" />
                <div className="menu-icon">{item.icon}</div>
              </div>
              <div className="menu-text">
                <span className="menu-title">{item.title}</span>
                <span className="menu-desc">{item.desc}</span>
              </div>
              {item.extra}
              <div className="menu-arrow">›</div>
            </Link>
          ))}
        </nav>

        {/* ── SCAN BUTTON ──────────────────── */}
        <div className="scan-section">
          <Link to="/scan" className="scan-btn-home">
            <div className="scan-btn-inner">
              <div className="scan-sweep" />
              <div className="scan-icon-wrap">📷</div>
              <span className="scan-label">مسح البطاقة</span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        {/* <p className="footer-note">
          ✦ San Giovanni Youth Ministry — جميع الحقوق محفوظة ✦
        </p> */}
      </main>
    </div>
  );
}

export default Home;
