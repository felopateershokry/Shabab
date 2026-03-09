import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card5odam from "../components/Card5odam";
import "./listPage.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function List5odam() {
  const navigate = useNavigate();
  const { input } = useParams();

  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Fetch all khodam from Firebase
  useEffect(() => {
    const fetchKhodam = async () => {
      const snapshot = await getDocs(collection(db, "khodam")); // changed here
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllCourses(data);
    };

    fetchKhodam();
  }, []);

  // Filter courses by input
  useEffect(() => {
    if (allCourses.length > 0) {
      const tempCourses = allCourses.slice();

      if (input) {
        setFilteredCourses(
          tempCourses.filter((item) =>
            item.name.toLowerCase().includes(input.toLowerCase())
          )
        );
      } else {
        setFilteredCourses(tempCourses);
      }
    }
  }, [allCourses, input]);

  return (
    <div className="course-list-container">
      <div className="course-list-header">
        <div>
          <h1 className="course-list-title">الخدام</h1>
          <div className="course-list-header-content">
            <p className="course-list-breadcrumb">
              <span className="breadcrumb-home" onClick={() => navigate("/")}>الرئيسية</span> /{" "}
              <span className="breadcrumb-current">الخدام</span>
            </p>

            <button onClick={() => navigate("/add-khodam")} className="add-button">
              اضافة خادم +
            </button>
          </div>
        </div>
      </div>

      <div className="course-list-grid">
        {filteredCourses.map((course) => (
          <Card5odam key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

export default List5odam;