import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import "./TodayAttendance.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";


function TodayAttendance() {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      try {
        const attendanceRef = collection(db, "makhdom");
        const querySnapshot = await getDocs(attendanceRef);

        const data = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((person) => {
            if (Array.isArray(person.visits)) {
              return person.visits.some((visit) => {
                if (typeof visit === "string") {
                  return visit === todayStr;
                } else if (visit && visit.seconds) {
                  const visitDate = new Date(visit.seconds * 1000);
                  return visitDate.toISOString().split("T")[0] === todayStr;
                }
                return false;
              });
            }
            return false;
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        setAttendees(data);
      } catch (error) {
        console.error("Error fetching today's attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAttendance();
  }, [todayStr]);

    if (loading) {
      
        return (
        
      <div className="attendance-container">
        <p>جارٍ التحميل...</p>
      </div>
    );
  }

    return (
        <>
            <Navbar />
        <div className="attendance-container">
          <h2 className="attendance-title">حضور اليوم - {todayStr}</h2>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>م</th>
                <th>الاسم</th>
                <th>تاريخ الحضور</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((attendee, index) => (
                <tr key={attendee.id} onClick={() => navigate(`/single-makhdom/${attendee.id}`)}>
                  <td>{index + 1}</td>
                  <td>{attendee.name}</td>
                  <td>{todayStr}</td>
                </tr>
              ))}
              {attendees.length === 0 && (
                <tr>
                  <td colSpan="3" className="no-data">
                    لا يوجد حضور اليوم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
}

export default TodayAttendance;
