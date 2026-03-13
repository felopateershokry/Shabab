import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";
import "./SearchByDate.css";
import { useNavigate } from "react-router-dom";
function SearchByDate() {

    const navigate = useNavigate();

  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [fromDate, setFromDate] = useState(""); // "DD-MM" أو "MM"
  const [toDate, setToDate] = useState(""); // "DD-MM" أو "MM"

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "makhdom");
        const querySnapshot = await getDocs(studentsRef);

        const data = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setAllStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error("خطأ أثناء جلب البيانات:", error);
      }
    };

    fetchStudents();
  }, []);

  const handleSearch = () => {
    if (!fromDate) {
      setFilteredStudents(allStudents);
      return;
    }

    const [fromDay, fromMonth] = fromDate.includes("-")
      ? fromDate.split("-").map(Number)
      : [null, Number(fromDate)];

    const [toDay, toMonth] = toDate
      ? toDate.includes("-")
        ? toDate.split("-").map(Number)
        : [null, Number(toDate)]
      : [null, null];

    const filtered = allStudents.filter((student) => {
      if (!student.dateOfBirth) return false; // تأكد أن هناك تاريخ ميلاد

      const date = new Date(student.dateOfBirth);
      const day = date.getDate();
      const month = date.getMonth() + 1;

      // لو بحثت بالشهر فقط
      if (!fromDay && !toDay) {
        if (toMonth) return month >= fromMonth && month <= toMonth;
        return month === fromMonth;
      }

      // لو بحثت باليوم والشهر
      const fromCompare = fromDay ? fromMonth * 100 + fromDay : fromMonth * 100;
      const toCompare = toDay
        ? toMonth * 100 + toDay
        : toMonth
          ? toMonth * 100 + 31
          : fromCompare;
      const studentCompare = month * 100 + day;

      return studentCompare >= fromCompare && studentCompare <= toCompare;
    });

    setFilteredStudents(filtered);
  };

  return (
    <>
      <Navbar />
      <div className="search-by-date-container">
        <h2>بحث حسب تاريخ الميلاد</h2>

        <div className="inputs-container">
          <div>
            <label>من (يوم-شهر أو شهر فقط):</label>
            <input
              type="text"
              placeholder="مثال: 05-03 أو 03"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label>إلى (اختياري):</label>
            <input
              type="text"
              placeholder="مثال: 10-03 أو 03"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button onClick={handleSearch}>بحث</button>
        </div>

        <table className="result-table">
          <thead>
            <tr>
              <th>Id</th>
              <th>الاسم</th>
              <th>تاريخ الميلاد</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.id} onClick={() => navigate(`/single-makhdom/${student.id}`)}>
                  <td>{student.customId}</td>
                  <td>{student.name}</td>
                  <td>{new Date(student.dateOfBirth).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">لا توجد نتائج</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default SearchByDate;
