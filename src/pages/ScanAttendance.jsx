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

          alert("تم تسجيل الحضور");
        };
      } catch (error) {
        console.error("NFC Error:", error);
      }
    };

    startScan();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>مرر كارت NFC لتسجيل الحضور</h1>
    </div>
  );
}

export default ScanAttendance;
