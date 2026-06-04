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
  where,
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
    nfcUID: "",
    coins: 0,
    password: "0000",
    khadem: "",
  });

  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [khademList, setKhademList] = useState([]); // ✅ قائمة الخدام من Firestore

  // ✅ جلب الخدام من collection khodam
  useEffect(() => {
    const fetchKhodam = async () => {
      const snapshot = await getDocs(collection(db, "khodam"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setKhademList(data);
    };
    fetchKhodam();
  }, []);

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
            coins: docSnap.data().coins ?? 0,
            password: docSnap.data().password || "0000",
            khadem: docSnap.data().khadem || "",
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
      reader.onreading = (event) => {
        const uid = event.serialNumber;
        setFormData((prev) => ({ ...prev, nfcUID: uid }));
        setScanning(false);
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
    if (saving) return;
    setSaving(true);

    try {
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
        // تعديل — مفيش داعي نتحقق من customId لأنه مش بيتغير
        await updateDoc(doc(db, "makhdom", id), {
          name: formData.name,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          notes: formData.notes,
          image: imageURL,
          nfcUID: formData.nfcUID,
          coins: formData.coins,
          password: formData.password,
          khadem: formData.khadem,
          updatedAt: Timestamp.now(),
        });
      } else {
        // ✅ حساب الـ nextId
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

        // ✅ التحقق إن الـ customId مش موجود قبل كده
        const duplicateCheck = await getDocs(
          query(collection(db, "makhdom"), where("customId", "==", nextId)),
        );

        if (!duplicateCheck.empty) {
          toast.error("حدث تعارض في الرقم، حاول مرة أخرى");
          setSaving(false);
          return;
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
          coins: 0,
          password: "0000",
          khadem: formData.khadem,
          createdAt: Timestamp.now(),
        });
      }

      navigate("/list-makhdom");
    } catch (error) {
      console.error("Firebase error:", error);
      toast.error("حدث خطأ أثناء الحفظ");
      setSaving(false);
    }
  };

  return (
    <div className="add-khodam-container">
      <ToastContainer />
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

        {/* ✅ الخادم من قائمة khodam collection */}
        <select
          name="khadem"
          value={formData.khadem}
          onChange={handleChange}
          className="search-input"
        >
          <option value="">اختر الخادم</option>
          {khademList.map((k) => (
            <option key={k.id} value={k.name}>
              {k.name}
            </option>
          ))}
        </select>

        <textarea
          name="notes"
          placeholder="ملاحظات"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
        />

        <input
          type="text"
          name="nfcUID"
          placeholder="NFC UID"
          value={formData.nfcUID}
          readOnly
        />

        <button type="button" className="scan-btn" onClick={scanNFC}>
          {scanning ? "Scanning..." : "Scan NFC Card"}
        </button>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
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
