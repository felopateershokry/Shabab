import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./TodayAttendance.css"; // نفس CSS للجدول
import Navbar from "../components/Navbar";

function MostAttendance() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchAttendanceCounts = async () => {
      try {
        const studentsRef = collection(db, "makhdom");
        const querySnapshot = await getDocs(studentsRef);

        const data = querySnapshot.docs
          .map((doc) => {
            const student = { id: doc.id, ...doc.data() };
            const visitCount = Array.isArray(student.visits)
              ? student.visits.length
              : student.lastVisit
                ? 1
                : 0; // إذا لا visits ولا lastVisit = 0
            return { ...student, visitCount };
          })
          .sort((a, b) => b.visitCount - a.visitCount); // الأكثر حضورًا فوق

        setStudents(data);
      } catch (error) {
        console.error("حدث خطأ أثناء جلب بيانات الحضور:", error);
      }
    };

    fetchAttendanceCounts();
  }, []);

  return (
    <>
      <Navbar />
    <div className="attendance-container">
      <h2 className="attendance-title">الطلاب حسب عدد الحضور</h2>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>م</th>
            <th>الاسم</th>
            <th>عدد الحضور</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.id}>
              <td>{index + 1}</td>
              <td>{student.name}</td>
              <td>{student.visitCount}</td>
            </tr>
          ))}
          {students.length === 0 && (
            <tr>
              <td colSpan="3" className="no-data">
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
