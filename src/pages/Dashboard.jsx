import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import "./Dashboard.css";
import Navbar from "../components/Navbar";

function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-CA");

  const [stats, setStats] = useState({
    totalMakhdom: 0,
    totalKhodam: 0,
    todayAttendance: 0,
    weeklyData: [],
    monthlyData: [],
    absentStudents: [], // كل الغائبين
    loading: true,
  });

  const [showAllAbsent, setShowAllAbsent] = useState(false); // ✅ زرار عرض الكل

    useEffect(() => {
      window.scrollTo(0, 0); // Scroll to top on mount
    const fetchAll = async () => {
      try {
        // ── 1. إجمالي المخدومين والخدام ──────────────────────
        const [makhdomSnap, khademSnap] = await Promise.all([
          getCountFromServer(collection(db, "makhdom")),
          getCountFromServer(collection(db, "khodam")),
        ]);

        // ── 2. بيانات الحضور التفصيلية ───────────────────────
        const makhdomDocs = await getDocs(collection(db, "makhdom"));
        const students = makhdomDocs.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const getDateStr = (v) => {
          if (!v) return null;
          if (typeof v === "string") return v;
          if (v.toDate) return v.toDate().toLocaleDateString("en-CA");
          return v;
        };

        // ── 3. حضور اليوم ─────────────────────────────────────
        const todayCount = students.filter((s) =>
          (s.visits || []).some((v) => getDateStr(v) === today),
        ).length;

        // ── 4. إحصائيات أسبوعية (آخر 7 أيام) ────────────────
        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toLocaleDateString("en-CA");
        });

        const weeklyData = weekDays.map((date) => {
          const dayName = new Date(date).toLocaleDateString("ar-EG", {
            weekday: "short",
          });
          const count = students.filter((s) =>
            (s.visits || []).some((v) => getDateStr(v) === date),
          ).length;
          return { date, dayName, count };
        });

        // ── 5. إحصائيات شهرية (أسابيع الشهر الحالي الفعلية) ──
        // ✅ بنبص على الشهر الحالي من أول يوم فيه لآخر يوم
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // أول يوم في الشهر
        const firstDay = new Date(year, month, 1);
        // آخر يوم في الشهر
        const lastDay = new Date(year, month + 1, 0);

        // تقسيم الشهر لأسابيع (كل 7 أيام من أول الشهر)
        const weeks = [];
        let weekStart = new Date(firstDay);
        let weekNum = 1;

        while (weekStart <= lastDay) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());

          // جمع الحضور في هذا الأسبوع
          let total = 0;
          for (
            let d = new Date(weekStart);
            d <= weekEnd;
            d.setDate(d.getDate() + 1)
          ) {
            const dateStr = d.toLocaleDateString("en-CA");
            total += students.filter((s) =>
              (s.visits || []).some((v) => getDateStr(v) === dateStr),
            ).length;
          }

          // label يعرض تاريخ بداية الأسبوع
          const startLabel = weekStart.toLocaleDateString("ar-EG", {
            day: "numeric",
            month: "short",
          });

          weeks.push({
            label: `${weekNum} (${startLabel})`,
            shortLabel: `أسبوع ${weekNum}`,
            count: total,
          });

          weekStart.setDate(weekStart.getDate() + 7);
          weekNum++;
        }

        const monthlyData = weeks;

        // ── 6. المخدومين الغائبين أكثر من 14 يوم ─────────────
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 14);
        const cutoffStr = cutoff.toLocaleDateString("en-CA");

        // ✅ مش .slice(0, 10) — بنخزن الكل
        const absentStudents = students
          .filter((s) => {
            if (!s.visits || s.visits.length === 0) return true;
            const lastVisit = getDateStr(s.visits[s.visits.length - 1]);
            return lastVisit < cutoffStr;
          })
          .sort((a, b) => {
            const aLast =
              a.visits?.length > 0
                ? getDateStr(a.visits[a.visits.length - 1])
                : "0000-00-00";
            const bLast =
              b.visits?.length > 0
                ? getDateStr(b.visits[b.visits.length - 1])
                : "0000-00-00";
            return aLast < bLast ? -1 : 1;
          });
        // ✅ لا يوجد .slice هنا — الكل محفوظ

        setStats({
          totalMakhdom: makhdomSnap.data().count,
          totalKhodam: khademSnap.data().count,
          todayAttendance: todayCount,
          weeklyData,
          monthlyData,
          absentStudents,
          loading: false,
        });
      } catch (err) {
        console.error("Dashboard error:", err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchAll();
  }, [today]);

  const maxWeekly = Math.max(...stats.weeklyData.map((d) => d.count), 1);
  const maxMonthly = Math.max(...stats.monthlyData.map((d) => d.count), 1);

  const attendanceRate =
    stats.totalMakhdom > 0
      ? Math.round((stats.todayAttendance / stats.totalMakhdom) * 100)
      : 0;

  // ✅ الغائبين المعروضين: 10 أو الكل حسب الزرار
  const displayedAbsent = showAllAbsent
    ? stats.absentStudents
    : stats.absentStudents.slice(0, 10);

  if (stats.loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <Navbar />
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">لوحة التحكم</h1>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {/* <button className="back-btn" onClick={() => navigate("/")}>
          ← الرئيسية
        </button> */}
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-cards">
        <div className="stat-card stat-purple">
          <div className="stat-icon">🙌</div>
          <div className="stat-info">
            <span className="stat-label">إجمالي المخدومين</span>
            <span className="stat-value">{stats.totalMakhdom}</span>
          </div>
        </div>

        <div className="stat-card stat-blue">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الخدام</span>
            <span className="stat-value">{stats.totalKhodam}</span>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-label">حضور اليوم</span>
            <span className="stat-value">{stats.todayAttendance}</span>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-label">نسبة الحضور</span>
            <span className="stat-value">{attendanceRate}%</span>
          </div>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-row">
        {/* Weekly Chart */}
        <div className="chart-card">
          <h2 className="chart-title">الحضور الأسبوعي</h2>
          <div className="bar-chart">
            {stats.weeklyData.map((day, i) => (
              <div className="bar-group" key={i}>
                <span className="bar-value">{day.count}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-fill-weekly"
                    style={{ height: `${(day.count / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="bar-label">{day.dayName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="chart-card">
          {/* ✅ العنوان بيعرض اسم الشهر الحالي */}
          <h2 className="chart-title">
            الحضور الشهري —{" "}
            {new Date().toLocaleDateString("ar-EG", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="bar-chart">
            {stats.monthlyData.map((week, i) => (
              <div className="bar-group" key={i}>
                <span className="bar-value">{week.count}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill bar-fill-monthly"
                    style={{ height: `${(week.count / maxMonthly) * 100}%` }}
                  />
                </div>
                <span className="bar-label">{week.shortLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Absent Students ── */}
      <div className="absent-card">
        <div className="absent-header">
          <h2 className="chart-title">
            ⚠️ مخدومين لم يحضروا منذ أكثر من أسبوعين
            <span className="absent-count">{stats.absentStudents.length}</span>
          </h2>

          {/* ✅ زرار عرض الكل / عرض أقل */}
          {stats.absentStudents.length > 10 && (
            <button
              className="show-all-btn"
              onClick={() => setShowAllAbsent((prev) => !prev)}
            >
              {showAllAbsent
                ? "عرض أقل ↑"
                : `عرض الكل (${stats.absentStudents.length}) ↓`}
            </button>
          )}
        </div>

        {stats.absentStudents.length === 0 ? (
          <p className="no-absent">🎉 كل المخدومين حضروا مؤخراً</p>
        ) : (
          <div className="absent-list">
            {displayedAbsent.map((s) => {
              const lastVisit =
                s.visits?.length > 0
                  ? (() => {
                      const v = s.visits[s.visits.length - 1];
                      if (typeof v === "string") return v;
                      if (v?.toDate)
                        return v.toDate().toLocaleDateString("ar-EG");
                      return v;
                    })()
                  : null;

              const daysAgo = lastVisit
                ? Math.floor(
                    (new Date() - new Date(lastVisit)) / (1000 * 60 * 60 * 24),
                  )
                : null;

              return (
                <div
                  key={s.id}
                  className="absent-item"
                  onClick={() => navigate(`/single-makhdom/${s.id}`)}
                >
                  <img
                    src={s.image || "/default-avatar.png"}
                    alt={s.name}
                    className="absent-avatar"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div className="absent-info">
                    <span className="absent-name">{s.name}</span>
                    <span className="absent-sub">
                      {s.khadem ? `خادم: ${s.khadem}` : ""}
                    </span>
                  </div>
                  <div className="absent-days">
                    {daysAgo !== null ? (
                      <>
                        <span className="days-num">{daysAgo}</span>
                        <span className="days-label">يوم</span>
                      </>
                    ) : (
                      <span className="days-label">لم يحضر</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
