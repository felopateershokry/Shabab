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
  });

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
          });
        }
      };
      fetchStudent();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        // تعديل المخدوم
        await updateDoc(doc(db, "makhdom", id), {
          name: formData.name,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          notes: formData.notes,
          image: imageURL,
          updatedAt: Timestamp.now(),
        });
      } else {

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
          visits: [],
          lastVisit: null,
          createdAt: Timestamp.now(),
        });
      }

      navigate("/list-makhdom");
    } catch (error) {
      console.error("Firebase error:", error);
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
