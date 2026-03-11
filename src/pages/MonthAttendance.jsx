import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./MonthAttendance.css";
import Navbar from "../components/Navbar";

const MonthAttendance = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // تقسيم الشهر لأسابيع
  const weeks = [];
  let start = 1;

  while (start <= totalDays) {
    const end = Math.min(start + 6, totalDays);
    weeks.push({ start, end });
    start += 7;
  }

  const fifthWeekExists =
    weeks.length === 5 &&
    Array.from(
      { length: weeks[4].end - weeks[4].start + 1 },
      (_, i) => weeks[4].start + i,
    ).some((day) => {
      const d = new Date(year, month, day);
      return d.getDay() === 5;
    });

  const displayedWeeks = fifthWeekExists ? weeks : weeks.slice(0, 4);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "makhdom"));

        const studentsData = snapshot.docs.map((doc) => {
          const data = doc.data();

          // تحويل visits إلى Date
          const visits = (data.visits || []).map((v) => {
            if (v?.seconds) {
              return new Date(v.seconds * 1000); // Firestore Timestamp
            }
            return new Date(v);
          });

          // الحضور في هذا الشهر
          const visitsThisMonth = visits.filter(
            (date) => date.getMonth() === month && date.getFullYear() === year,
          );

          return {
            id: doc.id,
            ...data,
            visits,
            visitsThisMonth,
          };
        });

        // ترتيب حسب أكثر حضور
        studentsData.sort(
          (a, b) => b.visitsThisMonth.length - a.visitsThisMonth.length,
        );

        setStudents(studentsData);
      } catch (error) {
        console.error("Error loading students:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [month, year]);
  
if (loading) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "20px",
        background: "radial-gradient(circle at top, #1f2937, #111827, #020617)",
      }}
    >
      جارٍ التحميل...
    </div>
  );
}

  return (
    <>
      <Navbar sticky />

      <div className="month-container">
        <h1 className="month-title">
          سجل الحضور لشهر{" "}
          {today.toLocaleString("ar-EG", { month: "long", year: "numeric" })}
        </h1>

        <div className="month-table-container">
          <table className="month-table">
            <thead>
              <tr>
                <th>الاسم</th>

                {displayedWeeks.map((week, idx) => (
                  <th key={idx}>
                    أسبوع {idx + 1} <br />({week.start}-{week.end})
                  </th>
                ))}

                <th>حضر الشهر كله؟</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>

                  {displayedWeeks.map((week, idx) => {
                    const hasVisit = student.visitsThisMonth.some((date) => {
                      const day = date.getDate();
                      return day >= week.start && day <= week.end;
                    });

                    return (
                      <td key={idx}>
                        {hasVisit ? (
                          <span className="present">✔</span>
                        ) : (
                          <span className="absent">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td>
                    {student.visitsThisMonth.length >= displayedWeeks.length ? (
                      <span className="full-month">✔</span>
                    ) : (
                      <span className="absent">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonthAttendance;
