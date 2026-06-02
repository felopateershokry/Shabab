import React, { useEffect, useState, useRef } from "react";
import "./Send.css";

import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  increment,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { startNFC, stopNFC } from "../services/nfcService"; // ✅ مهم جدًا

function Send() {
  const [searchTerm, setSearchTerm] = useState("");
  const [coins, setCoins] = useState("");
  const [selected, setSelected] = useState([]);
  const [users, setUsers] = useState([]);

  const scanningRef = useRef(false);

  // =========================
  // Fetch users
  // =========================
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "makhdom"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();

    // ✅ important cleanup (fix double scan forever bug)
    return () => {
      stopNFC();
    };
  }, []);

  // =========================
  // Normalize UID
  // =========================
  const normalizeUID = (uid) =>
    String(uid || "")
      .replace(/[:\s]/g, "")
      .toLowerCase();

  // =========================
  // Validate amount
  // =========================
  const getAmount = () => {
    const amount = Number(coins);

    if (!amount || amount <= 0) {
      toast.error("اولا ادخل عدد صحيح أكبر من صفر");
      return null;
    }

    return amount;
  };

  // =========================
  // Send coins
  // =========================
  const sendCoins = async () => {
    const amount = getAmount();
    if (!amount) return;

    if (selected.length === 0) {
      toast.error("حدد مستلم واحد على الأقل");
      return;
    }

    try {
      await Promise.all(
        selected.map(async (user) => {
          const userRef = doc(db, "makhdom", user.id);

          await updateDoc(userRef, {
            coins: increment(amount),
          });

          await addDoc(collection(db, "transfers"), {
            fromId: 1,
            toId: user.customId || null,
            fromName: "San Giovanni",
            toName: user.name,
            amount,
            type: "send",
            createdAt: serverTimestamp(),
          });
        }),
      );

      toast.success("تم ايداع " + amount + " نسر جنية");

      setCoins("");
      setSelected([]);

      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحديث البيانات");
    }
  };

  // =========================
  // NFC Scan (FIXED)
  // =========================
  const startNFCScan = async () => {
    try {
      const amount = getAmount();
      if (!amount) return;

      await startNFC((uid) => {
        const user = users.find(
          (u) => normalizeUID(u.nfcUID) === normalizeUID(uid),
        );

        if (!user) {
          toast.error("مستخدم غير معروف");
          return;
        }

        setSelected([user]);
        toast.success(`Selected: ${user.name}`);
      });

      toast.success( "قرب البطاقة الآن");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "خطأ في NFC");
    }
  };

  // =========================
  // Toggle select
  // =========================
  const toggleSelect = (user) => {
    const exists = selected.find((u) => u.id === user.id);

    if (exists) {
      setSelected([]);
    } else {
      setSelected([user]);
    }
  };

  // =========================
  // Filter users
  // =========================
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();

    return (
      u.name?.toLowerCase().includes(q) ||
      u.customId?.toString().toLowerCase().includes(q)
    );
  });

  return (
    <div className="send-container">
      <Navbar />

      <div className="search-wrapper">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Controls */}
      <div className="coins-box">
        <input
          type="number"
          placeholder="ادخل عدد النسر جنية"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />

        <button onClick={sendCoins}>ايداع نسر جنية</button>

        <button onClick={startNFCScan}>Scan NFC</button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th className="coins-th">ID</th>
              <th>نسر جنية</th>
              <th className="coins-th">حدد</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => toggleSelect(user)}
                className={
                  selected.find((u) => u.id === user.id) ? "active" : ""
                }
              >
                <td>{user.name}</td>
                <td className="coins-th">{user.customId || "-"}</td>
                <td>{user.coins || 0}</td>
                <td className="coins-th">
                  <input
                    type="checkbox"
                    checked={!!selected.find((u) => u.id === user.id)}
                    readOnly
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Send;
