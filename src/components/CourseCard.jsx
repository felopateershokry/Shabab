import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CourseCard.css";
import { db } from "../firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { assets } from "../assets/assets";

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  const [visitedToday, setVisitedToday] = useState(false);
  const [lastVisit, setLastVisit] = useState(null);
  const today = new Date().toLocaleDateString("en-CA");

  // دالة لتحويل التاريخ
  const getDateString = (visit) => {
    if (!visit) return null;
    if (typeof visit === "string") return visit;
    if (visit.toDate) return visit.toDate().toLocaleDateString("en-CA");
    return visit;
  };

  useEffect(() => {
    setVisitedToday(
      course.visits?.some((v) => getDateString(v) === today) || false,
    );
    setLastVisit(
      course.visits && course.visits.length > 0
        ? getDateString(course.visits[course.visits.length - 1])
        : null,
    );
  }, [course.visits, today]);

  const addVisit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "makhdom", course.id), {
        visits: arrayUnion(today),
        lastVisit: today,
      });

      // تحديث الـ state بعد إضافة الحضور
      setVisitedToday(true);
      setLastVisit(today);
    } catch (err) {
      console.error("خطأ أثناء إضافة الحضور:", err);
    }
  };

  const undoVisit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "makhdom", course.id), {
        visits: arrayRemove(today),
      });

      // حساب آخر حضور بعد التراجع
      const newVisits = (course.visits || []).filter(
        (v) => getDateString(v) !== today,
      );
      const newLastVisit =
        newVisits.length > 0
          ? getDateString(newVisits[newVisits.length - 1])
          : null;

      setVisitedToday(false);
      setLastVisit(newLastVisit);
    } catch (err) {
      console.error("خطأ أثناء التراجع عن الحضور:", err);
    }
  };

  return (
    <div className="course-card-wrapper">
      <Link
        to={`/single-makhdom/${course.id}`}
        onClick={() => scrollTo(0, 0)}
        className="course-card"
      >
        <img src={course.image || assets.felo} alt={course.name} />
        <div className="card-body">
          <h3>{course.name}</h3>
          <p>اخر حضور : {lastVisit || "لم يحضر"}</p>
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
