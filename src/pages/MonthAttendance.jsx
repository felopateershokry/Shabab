import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./MonthAttendance.css";
import Navbar from "../components/Navbar";

const MonthAttendance = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fridayCount, setFridayCount] = useState(4); // ✅ عدد الجمعات

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // ✅ كل جمع الشهر الحالي
  const fridaysInMonth = useMemo(() => {
    const fridays = [];
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      if (date.getDay() === 5) fridays.push(date); // 5 = الجمعة
    }
    return fridays;
  }, [year, month]);

  // ✅ آخر N جمعات (من اليوم للماضي)
  const lastNFridays = useMemo(() => {
    // كل الجمع من بداية 2024 لحد اليوم
    const allFridays = [];
    const cursor = new Date(today);
    // ابدأ من أقرب جمعة ماضية أو اليوم لو جمعة
    cursor.setDate(cursor.getDate() - ((cursor.getDay() + 2) % 7));
    // اجمع آخر fridayCount * 3 جمعة عشان نضمن كفاية
    for (let i = 0; i < fridayCount * 3 + 10; i++) {
      allFridays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() - 7);
    }
    return allFridays.slice(0, fridayCount).reverse(); // الأقدم أولاً
  }, [fridayCount, today]);

  // ✅ تحويل visit لـ Date بشكل صحيح
  const parseVisit = (v) => {
    if (!v) return null;
    if (v?.seconds) return new Date(v.seconds * 1000); // Firestore Timestamp object
    if (v?.toDate) return v.toDate(); // Firestore Timestamp method
    if (typeof v === "string") return new Date(v); // "2025-06-06"
    if (v instanceof Date) return v;
    return null;
  };

  // هل التاريخ ينتمي لأسبوع الجمعة دي (±3 أيام)
  const isSameWeekAsFriday = (visitDate, friday) => {
    const diff = Math.abs(visitDate - friday) / (1000 * 60 * 60 * 24);
    return diff <= 3; // نفس الأسبوع لو الفرق 3 أيام أو أقل
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "makhdom"));

        const studentsData = snapshot.docs.map((doc) => {
          const data = doc.data();

          // ✅ تحويل كل visit لـ Date
          const parsedVisits = (data.visits || [])
            .map(parseVisit)
            .filter(Boolean);

          // حضور الشهر الحالي
          const visitsThisMonth = parsedVisits.filter(
            (d) => d.getMonth() === month && d.getFullYear() === year,
          );

          return {
            id: doc.id,
            name: data.name || "",
            image: data.image || null,
            khadem: data.khadem || "",
            customId: data.customId,
            parsedVisits,
            visitsThisMonth,
          };
        });

        setStudents(studentsData);
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [month, year]);

  // ✅ حساب حضور كل طالب في آخر N جمعات
  const studentsWithFridays = useMemo(() => {
    return students
      .map((s) => {
        const fridayAttendance = lastNFridays.map((friday) =>
          s.parsedVisits.some((v) => isSameWeekAsFriday(v, friday)),
        );
        const attendedCount = fridayAttendance.filter(Boolean).length;
        return { ...s, fridayAttendance, attendedCount };
      })
      .sort((a, b) => b.attendedCount - a.attendedCount);
  }, [students, lastNFridays]);

  // ── تقسيم الشهر لأسابيع للجدول الشهري ──────────────────
  const monthWeeks = useMemo(() => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const w = [];
    let start = 1;
    while (start <= lastDay) {
      w.push({ start, end: Math.min(start + 6, lastDay) });
      start += 7;
    }
    return w.slice(0, 5);
  }, [year, month]);

  const formatFriday = (date) =>
    date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });

  if (loading) {
    return (
      <div className="ma-loading">
        <div className="ma-spinner" />
        <p>جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="ma-container">
        {/* ── Header ── */}
        <div className="ma-header">
          <div>
            <h1 className="ma-title">سجل الحضور</h1>
            <p className="ma-subtitle">
              {today.toLocaleString("ar-EG", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* ✅ Input عدد الجمعات */}
          <div className="ma-friday-control">
            <label className="ma-friday-label">عدد الجمعات</label>
            <div className="ma-friday-input-row">
              <button
                className="ma-counter-btn"
                onClick={() => setFridayCount((n) => Math.max(1, n - 1))}
              >
                −
              </button>
              <input
                type="number"
                className="ma-friday-input"
                value={fridayCount}
                min={1}
                max={20}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= 20) setFridayCount(val);
                }}
              />
              <button
                className="ma-counter-btn"
                onClick={() => setFridayCount((n) => Math.min(20, n + 1))}
              >
                +
              </button>
            </div>
            <p className="ma-friday-hint">يعرض آخر {fridayCount} جمعة</p>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="ma-summary">
          <div className="ma-summary-card">
            <span className="ma-summary-val">{students.length}</span>
            <span className="ma-summary-label">إجمالي المخدومين</span>
          </div>
          <div className="ma-summary-card ma-summary-green">
            <span className="ma-summary-val">
              {
                studentsWithFridays.filter(
                  (s) => s.attendedCount === fridayCount,
                ).length
              }
            </span>
            <span className="ma-summary-label">حضروا كل الجمعات</span>
          </div>
          <div className="ma-summary-card ma-summary-red">
            <span className="ma-summary-val">
              {studentsWithFridays.filter((s) => s.attendedCount === 0).length}
            </span>
            <span className="ma-summary-label">لم يحضروا أبداً</span>
          </div>
          <div className="ma-summary-card ma-summary-purple">
            <span className="ma-summary-val">{fridaysInMonth.length}</span>
            <span className="ma-summary-label">جمعات الشهر</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ma-table-wrapper">
          <table className="ma-table">
            <thead>
              <tr>
                <th className="ma-th-name">الاسم</th>
                {lastNFridays.map((friday, i) => (
                  <th key={i} className="ma-th-friday">
                    <span className="ma-friday-num">ج{i + 1}</span>
                    <span className="ma-friday-date">
                      {formatFriday(friday)}
                    </span>
                  </th>
                ))}
                <th className="ma-th-total">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {studentsWithFridays.map((student, rowIdx) => {
                const allAttended = student.attendedCount === fridayCount;
                const noneAttended = student.attendedCount === 0;
                return (
                  <tr
                    key={student.id}
                    className={`ma-row ${allAttended ? "ma-row-perfect" : noneAttended ? "ma-row-absent" : ""}`}
                    style={{ animationDelay: `${rowIdx * 0.03}s` }}
                  >
                    <td className="ma-td-name">
                      <div className="ma-student-info">
                        {student.image && (
                          <img
                            src={student.image}
                            alt={student.name}
                            className="ma-avatar"
                            onError={(e) => (e.target.style.display = "none")}
                          />
                        )}
                        <div>
                          <span className="ma-student-name">
                            {student.name}
                          </span>
                          {student.khadem && (
                            <span className="ma-student-khadem">
                              {student.khadem}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {student.fridayAttendance.map((attended, i) => (
                      <td key={i} className="ma-td-check">
                        {attended ? (
                          <span className="ma-present">✓</span>
                        ) : (
                          <span className="ma-absent-dash">—</span>
                        )}
                      </td>
                    ))}

                    <td className="ma-td-total">
                      <span
                        className={`ma-total-badge ${
                          allAttended
                            ? "ma-badge-perfect"
                            : noneAttended
                              ? "ma-badge-zero"
                              : "ma-badge-partial"
                        }`}
                      >
                        {student.attendedCount}/{fridayCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonthAttendance;
