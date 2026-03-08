import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SinglePage.css";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { assets } from "../assets/assets";

const SinglePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVisits, setShowVisits] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");
  const dropdownRef = useRef();

  useEffect(() => {
    const fetchStudent = async () => {
      const docRef = doc(db, "makhdom", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() });
      }

      setLoading(false);
    };

    fetchStudent();
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowVisits(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>;

  const visitedToday = student?.visits?.includes(today);

  const addVisit = async () => {
    await updateDoc(doc(db, "makhdom", id), {
      visits: arrayUnion(today),
      lastVisit: today,
    });

    setStudent({
      ...student,
      visits: [today, ...(student.visits || [])],
      lastVisit: today,
    });
  };

  const undoVisit = async () => {
    await updateDoc(doc(db, "makhdom", id), {
      visits: arrayRemove(today),
    });

    const newVisits = (student.visits || []).filter((v) => v !== today);

    setStudent({
      ...student,
      visits: newVisits,
      lastVisit: newVisits[0] || null,
    });
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذا المخدوم؟",
    );

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "makhdom", id));
    navigate("/list-makhdom");
  };

  return (
    <div className="single-container">
      <div className="single-card">
        <img
          src={student.image || assets.felo}
          alt={student.name}
          className="student-img"
        />

        <div className="student-info">
          <p>
            <span>الرقم التعريفي:</span> {student.customId}
          </p>

          <h1 className="student-name">{student.name}</h1>

          <p>
            <span> الهاتف:</span> {student.phone}
            <a
              href={`tel:${student.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-icon"
            >
              📞
            </a>
            <a
              href={`https://wa.me/20${student.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-icon"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="#25D366" // اللون الأخضر الرسمي للواتساب
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 2.11.55 4.08 1.52 5.8L.5 23.5l5.83-1.53A11.46 11.46 0 0012 23.5c6.35 0 11.5-5.15 11.5-11.5S18.35.5 12 .5zm6.3 16.86c-.27.76-1.5 1.45-2.07 1.54-.55.09-1.23.13-4.4-1.3-3.17-1.44-5.21-5.07-5.37-5.3-.16-.23-1.32-1.72-1.32-3.28s.88-2.35 1.2-2.66c.31-.31.68-.39.9-.39.23 0 .45 0 .65.01.2.02.46-.08.72.53.26.6.87 2.08.95 2.23.08.15.13.33.03.53-.1.2-.15.33-.3.53-.15.2-.32.45-.46.61-.15.16-.31.35-.13.68.18.33.8 1.38 1.72 2.24 1.19 1.15 2.18 1.49 2.5 1.66.32.18.5.16.68-.1.18-.26.78-.91.99-1.23.21-.31.43-.26.72-.16.29.1 1.83.86 2.14 1.02.31.16.52.24.6.38.08.15.08.9-.19 1.66z" />
              </svg>
            </a>
          </p>

          <p>
            <span> العنوان:</span> {student.address || "-"}
          </p>

          <p>
            <span> تاريخ الميلاد:</span> {student.dateOfBirth || "-"}
          </p>

          <p>
            <span> آخر حضور:</span>
            <span className="last-attend">
              {(student.lastVisit && student.visits.length !== 0) ? student.lastVisit : "لم يسجل حضور بعد"}
            </span>
          </p>

          <p>
            <span> ملاحظات:</span> {student.notes || "لا توجد ملاحظات"}
          </p>

          <div className="visit-actions">
            {!visitedToday ? (
              <button onClick={addVisit} className="visit-btn">
                حضور
              </button>
            ) : (
              <button onClick={undoVisit} className="undo-btn">
                تراجع
              </button>
            )}
          </div>

          {/* Visits Dropdown */}
          <div className="visits-container" ref={dropdownRef}>
            <div
              className="visits-toggle"
              onClick={() => setShowVisits((prev) => !prev)}
            >
              سجل الزيارات ⬇
            </div>

            {student.visits && student.visits.length > 0 && (
              <div className={`visits-dropdown ${showVisits ? "show" : ""}`}>
                {student.visits.map((v, i) => (
                  <div key={i} className="visit-item">
                    {v}
                  </div>
                ))}
              </div>
            )}

            {!student.visits || student.visits.length === 0 ? (
              <p className="no-visits">لا توجد زيارات مسجلة</p>
            ) : null}
          </div>

          <div className="single-actions">
            <button
              onClick={() => navigate(`/edit-makhdom/${id}`)}
              className="edit-btn"
            >
              ✏️ تعديل
            </button>

            <button onClick={handleDelete} className="delete-btn">
              🗑️ حذف
            </button>
          </div>

          <button
            className="back-btn"
            onClick={() => navigate("/list-makhdom")}
          >
            ⬅ العودة إلى القائمة
          </button>
        </div>
      </div>
    </div>
  );
};

export default SinglePage;
