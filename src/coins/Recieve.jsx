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

  const scanningRef = useRef(false);
  const lastUidRef = useRef("");
  const lastReadTimeRef = useRef(0);

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

  const normalizeUID = (uid) => {
    return String(uid || "")
      .replace(/[:\s]/g, "")
      .toLowerCase();
  };

  const deductCoins = async (user) => {
    const amount = Number(coins);

    if (!amount || amount <= 0) {
      toast.error("Enter valid amount first");
      return;
    }

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
        amount: amount,
        type: "receive",
        createdAt: serverTimestamp(),
      });

      toast.success(`${amount} coins deducted from ${user.name}`);

      setCoins("");

      await fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const startNFCScan = async () => {
    try {
      if (!coins || Number(coins) <= 0) {
        toast.error("Enter amount first");
        return;
      }

      if (!("NDEFReader" in window)) {
        toast.error("NFC is not supported");
        return;
      }

      if (scanningRef.current) {
        toast.info("Scanner already running");
        return;
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

        console.log("Card UID:", uid);

        const user = users.find(
          (u) => normalizeUID(u.nfcUID) === normalizeUID(uid),
        );

        console.log("Found User:", user);

        if (!user) {
          toast.error(`User not found: ${uid}`);
          return;
        }

        await deductCoins(user);
      };

      ndef.onreadingerror = () => {
        toast.error("Cannot read NFC tag");
      };
    } catch (err) {
      console.error("NFC Error:", err);
      toast.error(err?.message || "NFC permission denied");
    }
  };

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

      <div className="coins-box">
        <input
          type="number"
          placeholder="Enter amount to deduct"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />

        <button onClick={startNFCScan}>Scan NFC & Deduct</button>
      </div>

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
              <tr key={user.id}>
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
