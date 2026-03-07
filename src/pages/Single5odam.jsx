import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Single5odam.css";
import { db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { assets } from "../assets/assets";

function Single5odam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      const docRef = doc(db, "khodam", id); // changed here
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setStudentData(docSnap.data());
      } else {
        setStudentData(null);
      }
      setLoading(false);
    };

    fetchStudent();
  }, [id]);

  if (loading) return <p>جارٍ التحميل...</p>;

  if (!studentData) {
    return (
      <div className="single-container">
        <h2>البيانات غير موجودة</h2>
        <button onClick={() => navigate("/list-khodam")} className="back-btn">
          العودة إلى القائمة
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    const confirm = window.confirm("هل أنت متأكد أنك تريد حذف هذا الخادم؟");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "khodam", id)); // changed here
      alert("تم الحذف بنجاح");
      navigate("/list-khodam");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="single-container">
      <div className="single-card">
        <img
          src={studentData.image || assets.felo}
          alt={studentData.name}
          className="student-img"
        />

        <div className="student-info">
          <h1 className="student-name">{studentData.name}</h1>

          <p>
            <span> الهاتف:</span>
            {studentData.phone}

            <a
              href={`tel:${studentData.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-icon"
            >
              📞
            </a>

            <a
              href={`https://wa.me/20${studentData.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-icon"
            >
              💬
            </a>
          </p>

          <p>
            <span> العنوان:</span> {studentData.address || "-"}
          </p>

          <p>
            <span> تاريخ الميلاد:</span> {studentData.dateOfBirth || "-"}
          </p>

          <div className="single-actions">
            <button
              onClick={() => navigate(`/edit/${id}`)}
              className="edit-btn"
            >
              ✏️ تعديل
            </button>

            <button onClick={handleDelete} className="delete-btn">
              🗑️ حذف
            </button>
          </div>

          <button className="back-btn" onClick={() => navigate("/list-khodam")}>
            ⬅ العودة إلى القائمة
          </button>
        </div>
      </div>
    </div>
  );
}

export default Single5odam;