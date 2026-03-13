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

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, "makhdom"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id, // Firestore doc id
        ...doc.data(), // includes customId, name, etc.
      }));
      setAllStudents(data);
      setFilteredStudents(data);
    };
    fetchStudents();
  }, []);

  // Filter by name or customId
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const temp = allStudents.filter(
      (student) =>
        (student.name && student.name.toLowerCase().includes(term)) ||
        (student.customId &&
          student.customId.toString().toLowerCase().includes(term)),
    );
    setFilteredStudents(temp);
  }, [searchTerm, allStudents]);

  return (
    <div className="course-list-container">
      <div className="course-list-header">
        <div>
          <h1 className="course-list-title">المخدومين</h1>

          <div className="course-list-header-content">
            <p className="course-list-breadcrumb">
              <span className="breadcrumb-home" onClick={() => navigate("/")}>الرئيسية</span> /{" "}
              <span className="breadcrumb-current">المخدومين</span>
            </p>

            <button
              onClick={() => navigate("/add-makhdom")}
              className="add-button"
            >
              اضافة مخدوم +
            </button>
            <button onClick={() => navigate("/search-by-date")} className="add-button">
              تاريخ الميلاد
            </button>
            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم المخدوم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="course-list-grid">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <CourseCard key={student.id} course={student} />
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#64748b" }}>
            لا يوجد مخدوم مطابق للبحث
          </p>
        )}
      </div>
    </div>
  );
}

export default ListPage;
