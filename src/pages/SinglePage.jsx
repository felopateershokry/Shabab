import React, { useState, useEffect } from "react";
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

  const today = new Date().toISOString().split("T")[0];

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

  if (loading) return <p>جارٍ التحميل...</p>;

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
              {student.lastVisit || "لم يسجل حضور بعد"}
            </span>
          </p>

          <p>
            <span> ملاحظات:</span> {student.notes || "لا توجد ملاحظات"}
          </p>

          <div className="visit-actions">
            {!visitedToday ? (
              <button onClick={addVisit} className="visit-btn">
                ✔ حضور
              </button>
            ) : (
              <button onClick={undoVisit} className="undo-btn">
                ↩ تراجع
              </button>
            )}
          </div>

          {student.visits && student.visits.length ? (
            <div className="visits-history">
              <h3>سجل الزيارات</h3>

              {student.visits && student.visits.length ? (
                <div className="visits-list">
                  {student.visits.map((v, i) => (
                    <div key={i} className="visit-item">
                      {v}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-visits">لا توجد زيارات مسجلة</p>
              )}
            </div>
          ) : (
            <p>لا توجد زيارات</p>
          )}

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
