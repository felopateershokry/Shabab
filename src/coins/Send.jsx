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

import { startNFC } from "../services/nfcService";

function Send() {
  const [searchTerm, setSearchTerm] = useState("");
  const [coins, setCoins] = useState("");
  const [selected, setSelected] = useState([]);
  const [users, setUsers] = useState([]);

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
      toast.error("Enter valid coins amount first");
      return null;
    }

    return amount;
  };

  // =========================
  // Send coins to single user
  // =========================
  const sendToUser = async (user, amount) => {
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
  };

  // =========================
  // Manual send
  // =========================
  const sendCoins = async () => {
    const amount = getAmount();
    if (!amount) return;

    if (selected.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      await Promise.all(selected.map((u) => sendToUser(u, amount)));

      toast.success("Coins sent successfully!");

      setCoins("");
      setSelected([]);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  // =========================
  // NFC Scan (SAFE SINGLETON)
  // =========================
  const startNFCScan = async () => {
    try {
      const amount = getAmount();
      if (!amount) return;

      await startNFC(async (uid) => {
        console.log("NFC UID:", uid);

        const user = users.find(
          (u) => normalizeUID(u.nfcUID) === normalizeUID(uid),
        );

        if (!user) {
          toast.error("User not found");
          return;
        }

        await sendToUser(user, amount);

        toast.success(`Sent to ${user.name}`);
      });

      toast.success("NFC ready for sending");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "NFC error");
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

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Controls */}
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
              <th>Name</th>
              <th>ID</th>
              <th>Coins</th>
              <th>Select</th>
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
                <td>{user.customId || "-"}</td>
                <td>{user.coins || 0}</td>
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
