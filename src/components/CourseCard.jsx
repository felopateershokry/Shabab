import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CourseCard.css";
import { db } from "../firebase";
import {
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { assets } from "../assets/assets";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const [visitedToday, setVisitedToday] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (course.visits && course.visits.includes(today)) {
      setVisitedToday(true);
    }
  }, [course.visits]);



  const addVisit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "makhdom", course.id), {
      visits: arrayUnion(today),
      lastVisit: today,
    });
    setVisitedToday(true);
  };

  const undoVisit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "makhdom", course.id), {
      visits: arrayRemove(today),
    });
    setVisitedToday(false);
  };

  return (
    <div className="course-card-wrapper" >
      <Link
        to={`/single-makhdom/${course.id}`}
        onClick={() => scrollTo(0, 0)}
        className="course-card"
      >
        <img src={course.image || assets.felo} alt={course.name} />
        <div className="card-body">
          <h3>{course.name}</h3>
          <p>اخر حضور : {course.lastVisit || "لم يحضر"}</p>
        </div>
      </Link>
      <div className="course-card-actions">
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
    </div>
  );
};

export default CourseCard;
