import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddPage.css";
import { db, storage } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function AddPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    image: null,
    imagePreview: null,
  });

  useEffect(() => {
    if (id) {
      const fetchKhodam = async () => {
        const docRef = doc(db, "khodam", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData({
            name: docSnap.data().name || "",
            phone: docSnap.data().phone || "",
            dateOfBirth: docSnap.data().dateOfBirth || "",
            address: docSnap.data().address || "",
            image: null,
            imagePreview: docSnap.data().image || null,
          });
        }
      };
      fetchKhodam();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData({
      ...formData,
      image: file,
      imagePreview: URL.createObjectURL(file),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageURL = formData.imagePreview;

      if (formData.image) {
        const imageRef = ref(
          storage,
          `khodam/${Date.now()}-${formData.image.name}`,
        );
        await uploadBytes(imageRef, formData.image);
        imageURL = await getDownloadURL(imageRef);
      }

      if (id) {
        await updateDoc(doc(db, "khodam", id), {
          name: formData.name,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          image: imageURL,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, "khodam"), {
          name: formData.name,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          image: imageURL,
          createdAt: Timestamp.now(),
        });
      }

      navigate("/list-khodam");
    } catch (error) {
      console.error("Firebase error:", error);
    }
  };

  return (
    <div className="add-khodam-container">
      <h1 className="add-khodam-title">
        {id ? "تعديل بيانات الخادم" : "إضافة خادم جديد"}
      </h1>

      <form className="add-khodam-form" onSubmit={handleSubmit}>
        {/* Image Upload */}
        {/* <div className="image-upload">
          <label htmlFor="imageInput" className="image-clickable">
            {formData.imagePreview ? (
              <img src={formData.imagePreview} alt="Preview" />
            ) : (
              <div className="image-placeholder">صورة الخادم</div>
            )}
          </label>

          <input
            id="imageInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
        </div> */}

        <input
          type="text"
          name="name"
          placeholder="اسم الخادم"
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

        <div className="form-actions">
          <button type="submit" className="save-btn">
            حفظ
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/list-khodam")}
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPage;
