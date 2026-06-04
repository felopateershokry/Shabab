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
  const [khademList, setKhademList] = useState([]); // ✅ من collection khodam

  // ✅ جلب الخدام من collection khodam
  useEffect(() => {
    const fetchKhodam = async () => {
      const snapshot = await getDocs(collection(db, "khodam"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setKhademList(data);
    };
    fetchKhodam();
  }, []);

  // جلب المخدومين
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, "makhdom"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllStudents(data);
      setFilteredStudents(data);
    };
    fetchStudents();
  }, []);

  // فلترة
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const temp = allStudents.filter((student) => {
      const matchesSearch =
        (student.name && student.name.toLowerCase().includes(term)) ||
        (student.customId &&
          student.customId.toString().toLowerCase().includes(term));

      const matchesKhadem =
        khademFilter === "" ||
        (student.khadem && student.khadem === khademFilter);

      return matchesSearch && matchesKhadem;
    });
    setFilteredStudents(temp);
  }, [searchTerm, khademFilter, allStudents]);

  return (
    <div className="course-list-container">
      <div className="course-list-header">
        <div>
          <h1 className="course-list-title">المخدومين</h1>

          <div className="course-list-header-content">
            <p className="course-list-breadcrumb">
              <span className="breadcrumb-home" onClick={() => navigate("/")}>
                الرئيسية
              </span>{" "}
              / <span className="breadcrumb-current">المخدومين</span>
            </p>

            <button
              onClick={() => navigate("/add-makhdom")}
              className="add-button"
            >
              اضافة مخدوم +
            </button>

            <button
              onClick={() => navigate("/search-by-date")}
              className="add-button"
            >
              تاريخ الميلاد
            </button>

            <input
              type="text"
              placeholder="ابحث بالاسم أو رقم المخدوم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />

            {/* ✅ فلتر الخادم من khodam collection */}
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
