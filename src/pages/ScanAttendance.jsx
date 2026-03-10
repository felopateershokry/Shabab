import React, { useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { assets } from "../assets/assets";
import "./ScanAttendance.css";

function ScanAttendance() {
  useEffect(() => {
    const startScan = async () => {
      if (!("NDEFReader" in window)) {
        alert("NFC غير مدعوم في هذا الجهاز");
        return;
      }

      try {
        const reader = new NDEFReader();

        await reader.scan();

        console.log("Waiting for NFC card...");

        reader.onreading = async (event) => {
          const uid = event.serialNumber;

          console.log("Card UID:", uid);

          // البحث عن المخدوم
          const q = query(
            collection(db, "makhdom"),
            where("nfcUID", "==", uid),
          );

          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            alert("الكارت غير مسجل");
            return;
          }

          const studentDoc = querySnapshot.docs[0];
          const studentId = studentDoc.id;

          // تسجيل الحضور
          await updateDoc(doc(db, "makhdom", studentId), {
            visits: arrayUnion(Timestamp.now()),
            lastVisit: Timestamp.now(),
          });

          alert("تم تسجيل حضور" + studentDoc.data().name);
        };
      } catch (error) {
        console.error("NFC Error:", error);
      }
    };

    startScan();
  }, []);

  return (
    <div className="nfc-page">
      <div className="nfc-card-container">
        <img src={assets.felo} alt="NFC Icon" className="nfc-icon" />
        <h1 className="nfc-title">مرر كارت NFC لتسجيل الحضور</h1>
        <p className="nfc-subtitle">ضع الكارت بالقرب من الهاتف أو القارئ</p>
      </div>
    </div>
  );
}

export default ScanAttendance;
