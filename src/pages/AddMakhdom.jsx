import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddPage.css";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddMakhdom() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    notes: "",
    image: null,
    imagePreview: null,
    nfcUID: "", // 👈 UID الخاص بالكارت
  });

  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchStudent = async () => {
        const docRef = doc(db, "makhdom", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData({
            name: docSnap.data().name,
            phone: docSnap.data().phone,
            dateOfBirth: docSnap.data().dateOfBirth,
            address: docSnap.data().address || "",
            notes: docSnap.data().notes || "",
            image: null,
            imagePreview: docSnap.data().image || null,
            nfcUID: docSnap.data().nfcUID || "",
          });
        }
      };
      fetchStudent();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =========================
  // قراءة NFC
  // =========================

const scanNFC = async () => {
  if (!("NDEFReader" in window)) {
    toast.error("الموبايل لا يدعم NFC");
    return;
  }

  try {
    setScanning(true);

    const reader = new NDEFReader();
    await reader.scan();

    reader.onreading = async (event) => {
      const uid = event.serialNumber;

      // تحقق إذا كان الـ UID موجود بالفعل
      const q = query(collection(db, "makhdom"), where("nfcUID", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error("الكارت مسجل بالفعل لشخص آخر!");
        setScanning(false);
        return;
      }

      // لو جديد
      setFormData((prev) => ({
        ...prev,
        nfcUID: uid,
      }));

      setScanning(false);
      toast.success("تم قراءة الكارت بنجاح");
    };
  } catch (error) {
    console.error("NFC error:", error);
    setScanning(false);
  }
};

// =========================
// حفظ البيانات
// =========================

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // تحقق مرة ثانية قبل الحفظ
    if (formData.nfcUID) {
      const q = query(
        collection(db, "makhdom"),
        where("nfcUID", "==", formData.nfcUID),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty && (!id || querySnapshot.docs[0].id !== id)) {
        toast.error("الكارت مستخدم بالفعل لمخدوم آخر!");
        return;
      }
    }

    let imageURL = formData.imagePreview;

    if (formData.image) {
      const imageRef = ref(
        storage,
        `makhdom/${Date.now()}-${formData.image.name}`,
      );
      await uploadBytes(imageRef, formData.image);
      imageURL = await getDownloadURL(imageRef);
    }

    if (id) {
      // تعديل
      await updateDoc(doc(db, "makhdom", id), {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        notes: formData.notes,
        image: imageURL,
        nfcUID: formData.nfcUID,
        updatedAt: Timestamp.now(),
      });
    } else {
      // إنشاء ID تلقائي
      const q = query(
        collection(db, "makhdom"),
        orderBy("customId", "desc"),
        limit(1),
      );
      const querySnapshot = await getDocs(q);
      let nextId = 101;
      if (!querySnapshot.empty) {
        const lastStudent = querySnapshot.docs[0].data();
        nextId = (lastStudent.customId || 100) + 1;
      }

      await addDoc(collection(db, "makhdom"), {
        customId: nextId,
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        notes: formData.notes,
        image: imageURL,
        nfcUID: formData.nfcUID,
        visits: [],
        lastVisit: null,
        createdAt: Timestamp.now(),
      });
    }

    toast.success("تم حفظ البيانات بنجاح");
    navigate("/list-makhdom");
  } catch (error) {
    console.error("Firebase error:", error);
    toast.error("حدث خطأ أثناء الحفظ");
  }
};

  return (
    <div className="add-khodam-container">
      <h1 className="add-khodam-title">
        {id ? "تعديل بيانات المخدوم" : "إضافة مخدوم جديد"}
      </h1>

      <form className="add-khodam-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="اسم المخدوم"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder="رقم الهاتف"
          value={formData.phone}
          onChange={handleChange}
        />

        <input
          type="text"
          name="address"
          placeholder="العنوان"
          value={formData.address}
          onChange={handleChange}
        />

        <textarea
          name="notes"
          placeholder="ملاحظات"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
        />

        {/* NFC UID */}
        <input
          type="text"
          name="nfcUID"
          placeholder="NFC UID"
          value={formData.nfcUID}
          readOnly
        />

        <button
          type="button"
          className="scan-btn"
          onClick={scanNFC}
        >
          {scanning ? "Scanning..." : "Scan NFC Card"}
        </button>

        <div className="form-actions">
          <button type="submit" className="save-btn">
            حفظ
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/list-makhdom")}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddMakhdom;