import React, { useEffect, useState } from "react";
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

function Send() {
  const [searchTerm, setSearchTerm] = useState("");
  const [coins, setCoins] = useState("");
  const [selected, setSelected] = useState([]);
  const [users, setUsers] = useState([]);

  // 📥 Fetch users
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
  }, []);

  // 🔁 Toggle select
  const toggleSelect = (user) => {
    const exists = selected.find((u) => u.id === user.id);

    if (exists) {
      setSelected(selected.filter((u) => u.id !== user.id));
    } else {
      setSelected([...selected, user]);
    }
  };

  // 💰 Send coins
  const sendCoins = async () => {
    if (!coins || selected.length === 0) {
      toast.error("Please select users and enter coins amount");
      return;
    }

    try {
await Promise.all(
  selected.map(async (user) => {
    const userRef = doc(db, "makhdom", user.id);

    await updateDoc(userRef, {
      coins: increment(Number(coins)),
    });

    // ✅ سجل transaction لكل user
    await addDoc(collection(db, "transfers"), {
      fromId: 1,
      toId: user.customId || null, // 👈 San Giovanni ID
      fromName: "San Giovanni",
      toName: user.name,
      amount: Number(coins),
      type: "send",
      createdAt: serverTimestamp(),
    });
  }),
);

      toast.success("Coins sent successfully!");

      setCoins("");
      setSelected([]);

      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  // 📡 NFC Handler
  const startNFCScan = async () => {
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();

      toast.info("NFC scanning started...");

      ndef.onreading = (event) => {
        const nfcUid = event.serialNumber;

        const user = users.find((u) => u.nfcUid === nfcUid);

        if (user) {
          setSelected([user]);
          toast.success(`User selected: ${user.name}`);
        } else {
          toast.error("No user found for this NFC tag");
        }
      };
    } catch (err) {
      console.error("NFC Error:", err);
      toast.error("NFC not supported or permission denied");
    }
  };

  // 🔍 Search filter
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

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Coins input */}
      <div className="coins-box">
        <input
          type="number"
          placeholder="Enter coins amount"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />

        <button onClick={sendCoins}>Send Coins</button>
        <button onClick={startNFCScan}>Scan NFC</button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th className="coins-th">ID</th>
              <th className="coins-th">Coins</th>
              <th>حدد</th>
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
                <td className="coins-th">{user.coins || 0}</td>
                <td>
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