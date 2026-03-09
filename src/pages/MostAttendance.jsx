import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import "./MostAttendance.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function MostAttendance() {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const fetchAttendanceCounts = async () => {
      try {
        const studentsRef = collection(db, "makhdom");
        const querySnapshot = await getDocs(studentsRef);

        const data = querySnapshot.docs
          .map((docSnap) => {
            const student = { id: docSnap.id, ...docSnap.data() };

            const visitCount = Array.isArray(student.visits)
              ? student.visits.length
              : student.lastVisit
                ? 1
                : 0;

            return {
              ...student,
              visitCount,
              visits: student.visits || [],
            };
          })
          .sort((a, b) => b.visitCount - a.visitCount);

        setStudents(data);
      } catch (error) {
        console.error("حدث خطأ أثناء جلب البيانات:", error);
      }
    };

    fetchAttendanceCounts();
  }, []);

  const addVisit = async (e, student) => {
    e.stopPropagation();

    try {
      await updateDoc(doc(db, "makhdom", student.id), {
        visits: arrayUnion(today),
        lastVisit: today,
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? {
                ...s,
                visits: [today, ...(s.visits || [])],
                lastVisit: today,
                visitCount: (s.visitCount || 0) + 1,
              }
            : s,
        ),
      );
    } catch (error) {
      console.error("خطأ أثناء إضافة الحضور:", error);
    }
  };

  const undoVisit = async (e, student) => {
    e.stopPropagation();

    try {
      await updateDoc(doc(db, "makhdom", student.id), {
        visits: arrayRemove(today),
      });

      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === student.id) {
            const newVisits = (s.visits || []).filter((v) => v !== today);

            return {
              ...s,
              visits: newVisits,
              lastVisit: newVisits[0] || null,
              visitCount: Math.max((s.visitCount || 1) - 1, 0),
            };
          }
          return s;
        }),
      );
    } catch (error) {
      console.error("خطأ أثناء التراجع عن الحضور:", error);
    }
  };

  return (
    <>
      <Navbar />

      <div className="attendance-container">
        <h2 className="attendance-title">الترتيب حسب عدد الحضور</h2>

        <table className="attendance-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>الاسم</th>
              <th className="disable1">عدد الحضور</th>
              <th className="disable1">اخر حضور</th>
              <th>حضور</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student, index) => {
              const visitedToday = student.visits?.includes(today);

              return (
                <tr
                  key={student.id}
                  onClick={() => navigate(`/single-makhdom/${student.id}`)}
                >
                  <td> {student.customId}</td>

                  <td>{student.name}</td>

                  <td className="disable1">{student.visitCount}</td>

                  <td className="disable1">
                    {student.lastVisit && student.visits.length !== 0
                      ? student.lastVisit
                      : "لم يحضر"}
                  </td>

                  <td>
                    <div
                      className="visit-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!visitedToday ? (
                        <button
                          onClick={(e) => addVisit(e, student)}
                          className="visit-btn"
                        >
                          حضور
                        </button>
                      ) : (
                        <button
                          onClick={(e) => undoVisit(e, student)}
                          className="undo-btn"
                        >
                          تراجع
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan="5" className="no-data">
                  لا يوجد طلاب
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default MostAttendance;
