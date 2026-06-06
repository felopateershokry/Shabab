import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./listPage.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import CourseCard from "../components/CourseCard";

function ListPage() {
  const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [khademFilter, setKhademFilter] = useState("");
  const [khademList, setKhademList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── جلب الخدام ──────────────────────────────────────────
  useEffect(() => {
    const fetchKhodam = async () => {
      const snapshot = await getDocs(collection(db, "khodam"));
      setKhademList(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    };
    fetchKhodam();
  }, []);

  // ── جلب المخدومين ───────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "makhdom"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllStudents(data);
        setFilteredStudents(data);
      } catch (err) {
        console.error("خطأ في جلب المخدومين:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // ── فلترة ───────────────────────────────────────────────
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredStudents(
      allStudents.filter((s) => {
        const matchesSearch =
          (s.name && s.name.toLowerCase().includes(term)) ||
          (s.customId && s.customId.toString().toLowerCase().includes(term));
        const matchesKhadem =
          khademFilter === "" || (s.khadem && s.khadem === khademFilter);
        return matchesSearch && matchesKhadem;
      }),
    );
  }, [searchTerm, khademFilter, allStudents]);

  return (
    <div className="course-list-container">
      {/* ── HEADER ─────────────────────────────────────── */}
      <header className="course-list-header">
        <h1 className="course-list-title">المخدومين</h1>

        <div className="course-list-header-content">
          {/* breadcrumb — full width row */}
          <p className="course-list-breadcrumb">
            <span className="breadcrumb-home" onClick={() => navigate("/")}>
              الرئيسية
            </span>
            {" / "}
            <span className="breadcrumb-current">المخدومين</span>
          </p>

          {/* action buttons */}
          <button
            className="add-button"
            onClick={() => navigate("/add-makhdom")}
          >
            إضافة مخدوم +
          </button>

          <button
            className="add-button"
            onClick={() => navigate("/search-by-date")}
          >
            🎂 تاريخ الميلاد
          </button>

          {/* search */}
          <input
            type="text"
            placeholder="ابحث بالاسم أو الرقم…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-id-name"
          />

          {/* khadem filter */}
          <select
            value={khademFilter}
            onChange={(e) => setKhademFilter(e.target.value)}
            className="search-input"
          >
            <option value="">كل الخدام</option>
            {khademList.map((k) => (
              <option key={k.id} value={k.name}>
                {k.name}
              </option>
            ))}
          </select>

          {/* live count chip */}
          {!loading && (
            <span className="results-count">
              {filteredStudents.length} مخدوم
            </span>
          )}
        </div>
      </header>

      {/* ── GRID ───────────────────────────────────────── */}
      <div className="course-list-grid">
        {loading ? (
          /* skeleton shimmer cards while loading */
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 220,
                borderRadius: 20,
                background: "linear-gradient(160deg,#1e2d45,#0d1829)",
                border: "1px solid rgba(201,168,76,0.08)",
                opacity: 0.5,
                animation: `fadeSlideUp 0.4s ease-out ${i * 0.07}s both`,
              }}
            />
          ))
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student, i) => (
            <div
              key={student.id}
              style={{
                animation: `fadeSlideUp 0.45s ease-out ${i * 0.04}s both`,
              }}
            >
              <CourseCard course={student} />
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <p>لا يوجد مخدوم مطابق للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListPage;
