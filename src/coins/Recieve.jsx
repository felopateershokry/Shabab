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

import { startNFC, stopNFC } from "../services/nfcService"; // ✅ مهم

function Recieve() {
  const [searchTerm, setSearchTerm] = useState("");
  const [coins, setCoins] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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

    // ✅ مهم جدًا يمنع أي NFC listener قديم
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
  // Deduct coins
  // =========================
  const deductCoins = async (user) => {
    const amount = getAmount();
    if (!amount) return;

    if ((user.coins || 0) < amount) {
      toast.error("رصيد غير كافٍ");
      return;
    }

    try {
      const userRef = doc(db, "makhdom", user.id);

      await updateDoc(userRef, {
        coins: increment(-amount),
      });

      await addDoc(collection(db, "transfers"), {
        fromId: user.customId,
        toId: 1,
        fromName: user.name,
        toName: "San Giovanni",
        amount,
        type: "receive",
        createdAt: serverTimestamp(),
      });

      toast.success(`${amount} نسر جنية تم سحبها من ${user.name}`);

      setCoins("");
      setSelectedUser(null);

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

      await startNFC(async (uid) => {
        const user = users.find(
          (u) => normalizeUID(u.nfcUID) === normalizeUID(uid),
        );

        if (!user) {
          toast.error("مستخدم غير معروف");
          return;
        }

        await deductCoins(user);
      });

      toast.success( "قرب البطاقة الآن");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "خطأ في NFC");
    }
  };

  // =========================
  // Manual withdraw
  // =========================
  const handleManualWithdraw = async () => {
    if (!selectedUser) {
      toast.error("اختر مستخدم أولاً");
      return;
    }

    await deductCoins(selectedUser);
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
      
      <ToastContainer position="top-right" autoClose={2500} />

      {/* Controls */}
      <div className="coins-box">
        <input
          type="number"
          placeholder="ادخل عدد النسر جنية"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />

        <button
          onClick={handleManualWithdraw}
          style={{ background: "#d9534f" }}
        >
          سحب نسر جنية
        </button>

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
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={selectedUser?.id === user.id ? "active" : ""}
              >
                <td>{user.name}</td>
                <td className="coins-th">{user.customId || "-"}</td>
                <td>{user.coins || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Recieve;
