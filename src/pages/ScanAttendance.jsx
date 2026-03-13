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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ScanAttendance.css";

function ScanAttendance() {
  useEffect(() => {
    const scannedUIDs = new Set(); // لتخزين الكروت الممسوحة مؤقتًا

    const startScan = async () => {
      if (!("NDEFReader" in window)) {
        toast.error("NFC غير مدعوم في هذا الجهاز");
        return;
      }

      try {
        const reader = new NDEFReader();
        await reader.scan();

        console.log("Waiting for NFC card...");

        reader.onreading = async (event) => {
          const uid = event.serialNumber;

          // حماية مؤقتة على ال front-end (10 ثواني)
          if (scannedUIDs.has(uid)) {
            console.log("تم مسح هذا الكارت مؤخراً، تجاهل القراءة");
            return;
          }
          scannedUIDs.add(uid);
          setTimeout(() => scannedUIDs.delete(uid), 10000); // 10 ثواني

          console.log("Card UID:", uid);

          // البحث عن المخدوم
          const q = query(
            collection(db, "makhdom"),
            where("nfcUID", "==", uid),
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            toast.warning("الكارت غير مسجل");
            return;
          }

          const studentDoc = querySnapshot.docs[0];
          const studentId = studentDoc.id;

          // تسجيل الحضور مرة واحدة لكل يوم
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0); // بداية اليوم

          await updateDoc(doc(db, "makhdom", studentId), {
            visits: arrayUnion(todayDate), // يضيف اليوم مرة واحدة فقط
            lastVisit: Timestamp.now(),
          });

          toast.success("تم تسجيل حضور " + studentDoc.data().name);
        };
      } catch (error) {
        console.error("NFC Error:", error);
        toast.error("حدث خطأ أثناء قراءة الكارت");
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

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default ScanAttendance;
