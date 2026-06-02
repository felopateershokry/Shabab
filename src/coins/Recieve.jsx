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

function Recieve() {
  const [searchTerm, setSearchTerm] = useState("");
  const [coins, setCoins] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const scanningRef = useRef(false);
  const lastUidRef = useRef("");
  const lastReadTimeRef = useRef(0);

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
      toast.error("Enter valid amount first");
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
      toast.error("Not enough balance");
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

      toast.success(`${amount} coins deducted from ${user.name}`);

      setCoins("");
      setSelectedUser(null);

      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  // =========================
  // Reset scanner
  // =========================
  const resetScanner = () => {
    scanningRef.current = false;
    lastUidRef.current = "";
    lastReadTimeRef.current = 0;
  };

  // =========================
  // NFC Scan
  // =========================
  const startNFCScan = async () => {
    try {
      const amount = getAmount();
      if (!amount) return;

      if (!("NDEFReader" in window)) {
        toast.error("NFC not supported");
        return;
      }

      if (scanningRef.current) {
        resetScanner();
      }

      const ndef = new window.NDEFReader();
      await ndef.scan();

      scanningRef.current = true;

      toast.success("NFC Scanner Started");

      ndef.onreading = async (event) => {
        const uid = event.serialNumber;

        const now = Date.now();

        if (
          uid === lastUidRef.current &&
          now - lastReadTimeRef.current < 1500
        ) {
          return;
        }

        lastUidRef.current = uid;
        lastReadTimeRef.current = now;

        const user = users.find(
          (u) => normalizeUID(u.nfcUID) === normalizeUID(uid),
        );

        if (!user) {
          toast.error("User not found");
          return;
        }

        await deductCoins(user);

        // important reset after success
        resetScanner();
      };

      ndef.onreadingerror = () => {
        toast.error("Cannot read NFC tag");
      };
    } catch (err) {
      console.error(err);
      toast.error("NFC error");
    }
  };

  // =========================
  // Manual withdraw
  // =========================
  const handleManualWithdraw = async () => {
    if (!selectedUser) {
      toast.error("Select a user first");
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

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <ToastContainer position="top-right" autoClose={2500} />

      {/* Controls */}
      <div className="coins-box">
        <input
          type="number"
          placeholder="Enter amount"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />

        <button onClick={startNFCScan}>Scan NFC</button>

        <button
          onClick={handleManualWithdraw}
          style={{ background: "#d9534f" }}
        >
          Manual Withdraw
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Coins</th>
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
                <td>{user.customId || "-"}</td>
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
