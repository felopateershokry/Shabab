import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./MonthAttendance.css";
import Navbar from "../components/Navbar"; // افترض Navbar موجود

const MonthAttendance = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get current month info
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  // Divide month into weeks
  const weeks = [];
  let start = 1;
  while (start <= totalDays) {
    const end = Math.min(start + 6, totalDays);
    weeks.push({ start, end });
    start += 7;
  }

  // Check if 5th week contains Friday (day 5)
  const fifthWeekExists =
    weeks.length === 5 &&
    Array.from(
      { length: weeks[4].end - weeks[4].start + 1 },
      (_, i) => weeks[4].start + i,
    ).some((day) => {
      const d = new Date(year, month, day);
      return d.getDay() === 5; // 5 = Friday in JS
    });

  const displayedWeeks = fifthWeekExists ? weeks : weeks.slice(0, 4);

  useEffect(() => {
    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, "makhdom"));
      const studentsData = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });

      // Sort by total visits in the month
      const monthStr = (month + 1).toString().padStart(2, "0"); // e.g. "03"
      studentsData.sort((a, b) => {
        const aCount = (a.visits || []).filter((v) =>
          v.startsWith(`${year}-${monthStr}`),
        ).length;
        const bCount = (b.visits || []).filter((v) =>
          v.startsWith(`${year}-${monthStr}`),
        ).length;
        return bCount - aCount;
      });

      setStudents(studentsData);
      setLoading(false);
    };

    fetchStudents();
  }, [month, year]);

  if (loading) return <p style={{ textAlign: "center" }}>جارٍ التحميل...</p>;

  return (
    <>
      <Navbar sticky /> {/* navbar sticky */}
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
              {students.map((student) => {
                const monthStr = (month + 1).toString().padStart(2, "0");
                const visitsThisMonth = (student.visits || []).filter((v) =>
                  v.startsWith(`${year}-${monthStr}`),
                );

                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    {displayedWeeks.map((week, idx) => {
                      const weekVisits = visitsThisMonth.filter((v) => {
                        const day = parseInt(v.split("-")[2], 10);
                        return day >= week.start && day <= week.end;
                      });
                      return (
                        <td key={idx}>
                          {weekVisits.length > 0 ? (
                            <span className="present">✔</span>
                          ) : (
                            <span className="absent">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      {visitsThisMonth.length === displayedWeeks.length ? (
                        <span className="full-month">✔</span>
                      ) : (
                        <span className="absent">-</span>
                      )}
                    </td>{" "}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonthAttendance;
