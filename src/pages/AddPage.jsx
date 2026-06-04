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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id); // ✅ show loading while fetching

  useEffect(() => {
    if (id) {
      const fetchKhodam = async () => {
        try {
          const docRef = doc(db, "khodam", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              name: data.name || "",
              phone: data.phone || "",
              dateOfBirth: data.dateOfBirth || "",
              address: data.address || "",
              image: null,
              imagePreview: data.image || null,
            });
          } else {
            toast.error("لم يتم العثور على البيانات");
            navigate("/list-khodam");
          }
        } catch (error) {
          console.error("Fetch error:", error);
          toast.error("حدث خطأ أثناء تحميل البيانات");
          navigate("/list-khodam");
        } finally {
          setLoading(false); // ✅ done loading
        }
      };
      fetchKhodam();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (saving) return;
    setSaving(true);

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
        toast.success("تم التعديل بنجاح");
      } else {
        await addDoc(collection(db, "khodam"), {
          name: formData.name,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address,
          image: imageURL,
          createdAt: Timestamp.now(),
        });
        toast.success("تمت الإضافة بنجاح");
      }

      setTimeout(() => navigate("/list-khodam"), 1000); // ✅ let toast show
    } catch (error) {
      console.error("Firebase error:", error);
      toast.error("حدث خطأ أثناء الحفظ");
      setSaving(false);
    }
  };

  // ✅ Don't render form until data is loaded
  if (loading) {
    return (
      <div className="add-khodam-container">
        <p>جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="add-khodam-container">
      <ToastContainer />
      <h1 className="add-khodam-title">
        {id ? "تعديل بيانات الخادم" : "إضافة خادم جديد"}
      </h1>
      <form className="add-khodam-form" onSubmit={handleSubmit}>
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

        {/* ✅ Image upload input was missing! */}
        {/* <input type="file" accept="image/*" onChange={handleImageChange} />

        {formData.imagePreview && (
          <img
            src={formData.imagePreview}
            alt="معاينة"
            style={{
              width: "100px",
              height: "100px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        )} */}

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ"}
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
