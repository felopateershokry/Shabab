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

function Recieve() {
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

  // 🖱️ Manual select (fallback mode)
  const toggleSelect = (user) => {
    const exists = selected.find((u) => u.id === user.id);

    if (exists) {
      setSelected([]);
    } else {
      setSelected([user]); // single selection
    }
  };

  // 💸 Deduct coins (shared logic)
  const deductCoins = async (user) => {
    const amount = Number(coins);

    if (!amount) {
      toast.error("Enter amount first");
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
          amount: Number(coins),
          type: "receive",
          createdAt: serverTimestamp(),
        });

      toast.success(`${amount} coins deducted from ${user.name}`);

      setCoins("");
      setSelected([]);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  // 📡 NFC scan → auto select only (NO auto deduct)
  const startNFCScan = async () => {
    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();

      toast.info("Tap NFC card...");

      ndef.onreading = (event) => {
        const nfcUid = event.serialNumber;

        const user = users.find((u) => u.nfcUid === nfcUid);

        if (!user) {
          toast.error("User not found");
          return;
        }

        setSelected([user]); // فقط تحديد
        toast.success(`Selected: ${user.name}`);
      };
    } catch (err) {
      console.error(err);
      toast.error("NFC not supported or denied");
    }
  };

  // 🔥 Confirm deduct manually
  const handleDeduct = async () => {
    if (!selected.length) {
      toast.error("Select a user first");
      return;
    }

    await deductCoins(selected[0]);
  };

  // 🔍 search
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

      {/* INPUT */}
      <div className="coins-box">
        <input
          type="number"
          placeholder="Enter amount to deduct"
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />

        <button onClick={startNFCScan}>Scan NFC (Optional)</button>

        <button onClick={handleDeduct}>Deduct Coins</button>
      </div>

      {/* TABLE */}
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
                onClick={() => toggleSelect(user)}
                className={
                  selected.find((u) => u.id === user.id) ? "active" : ""
                }
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
