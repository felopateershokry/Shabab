import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CourseCard.css";
import { db } from "../firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { assets } from "../assets/assets";

const Card5odam = ({ course }) => {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault(); 

    const confirmDelete = window.confirm(
      "هل أنت متأكد أنك تريد حذف هذا الخادم؟"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "khodam", course.id)); // changed here
      alert("تم الحذف بنجاح");
      navigate(0); // Refresh page
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    navigate(`/edit/${course.id}`);
  };

  return (
    <div className="course-card-wrapper">
      <Link
        to={`/single-khodam/${course.id}`}
        onClick={() => scrollTo(0, 0)}
        className="course-card"
      >
        <img
          src={course.image || course.imagePreview || assets.felo}
          alt={course.name}
        />

        <div className="card-body">
          <h3>{course.name}</h3>
          <p className="amin">{course.notes ? course.notes : ""}</p>
        </div>
      </Link>


    </div>
  );
};

export default Card5odam;