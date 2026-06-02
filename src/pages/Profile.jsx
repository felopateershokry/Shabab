import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Profile.css";

function Profile() {
  const { customId } = useParams();

  const [makhdom, setMakhdom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [transferring, setTransferring] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchMakhdom();
    fetchTransactions();
  }, [customId]);

  // ======================
  // FETCH USER
  // ======================
  const fetchMakhdom = async () => {
    try {
      const q = query(
        collection(db, "makhdom"),
        where("customId", "==", Number(customId)),
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const d = snap.docs[0];
        setMakhdom({ id: d.id, ...d.data() });
      } else {
        setMakhdom(null);
      }
    } catch (err) {
      toast.error("Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // FETCH TRANSACTIONS (FIXED + SAFE)
  // ======================
  const fetchTransactions = async () => {
    try {
      const q1 = query(
        collection(db, "transfers"),
        where("fromId", "==", Number(customId)),
      );

      const q2 = query(
        collection(db, "transfers"),
        where("toId", "==", Number(customId)),
      );

      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const sent = s1.docs.map((d) => ({
        id: d.id,
        type: "sent",
        ...d.data(),
      }));

      const received = s2.docs.map((d) => ({
        id: d.id,
        type: "received",
        ...d.data(),
      }));

      const merged = [...sent, ...received].sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );

      setTransactions(merged);
    } catch (err) {
      console.log(err);
    }
  };

  // ======================
  // FORMAT DATE
  // ======================
  const formatDate = (v) => {
    if (!v) return "-";
    if (v?.seconds) {
      return new Date(v.seconds * 1000).toLocaleDateString("en-CA");
    }
    return v;
  };

  // ======================
  // TRANSFER
  // ======================
  const handleTransfer = async () => {
    if (transferring) return;

    const value = Number(amount);

    if (!toId || !amount || !password) {
      return toast.error("Fill all fields");
    }

    if (!makhdom?.password || password !== makhdom.password) {
      return toast.error("Wrong password");
    }

    if (value <= 0) return toast.error("Invalid amount");
    if (Number(toId) === Number(customId))
      return toast.error("Cannot send to yourself");

    setTransferring(true);
    const loadingToast = toast.loading("Processing...");

    try {
      const senderQ = query(
        collection(db, "makhdom"),
        where("customId", "==", Number(customId)),
      );

      const receiverQ = query(
        collection(db, "makhdom"),
        where("customId", "==", Number(toId)),
      );

      const [senderSnap, receiverSnap] = await Promise.all([
        getDocs(senderQ),
        getDocs(receiverQ),
      ]);

      const sender = senderSnap.docs[0];
      const receiver = receiverSnap.docs[0];

      if (!sender || !receiver) throw new Error("User not found");

      const senderData = sender.data();
      const receiverData = receiver.data();

      if ((senderData.coins || 0) < value) {
        throw new Error("Not enough coins");
      }

      await updateDoc(doc(db, "makhdom", sender.id), {
        coins: senderData.coins - value,
      });

      await updateDoc(doc(db, "makhdom", receiver.id), {
        coins: (receiverData.coins || 0) + value,
      });

      await addDoc(collection(db, "transfers"), {
        fromId: Number(customId),
        toId: Number(toId),
        fromName: makhdom.name,
        toName: receiverData.name,
        amount: value,
        createdAt: serverTimestamp(),
      });

      toast.update(loadingToast, {
        render: "Transfer successful",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setToId("");
      setAmount("");
      setPassword("");

      fetchMakhdom();
      fetchTransactions();
    } catch (err) {
      toast.update(loadingToast, {
        render: err.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setTransferring(false);
    }
  };

  // ======================
  // CHANGE PASSWORD
  // ======================
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword)
      return toast.error("Fill all fields");

    if (currentPassword !== makhdom?.password)
      return toast.error("Wrong current password");

    if (newPassword !== confirmNewPassword)
      return toast.error("Passwords do not match");

    setUpdatingPassword(true);
    const t = toast.loading("Updating password...");

    try {
      await updateDoc(doc(db, "makhdom", makhdom.id), {
        password: newPassword,
      });

      toast.update(t, {
        render: "Password updated",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      window.location.reload();
    } catch (err) {
      toast.update(t, {
        render: "Failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) return <h2>Loading...</h2>;
  if (!makhdom) return <h2>User not found</h2>;

  return (
    <div className="profile-container">
      <ToastContainer />

      <div className="profile-card">
        <div className="coins-badge">🪙 {makhdom.coins ?? 0}</div>

        <h1>{makhdom.name}</h1>
        <span className="profile-id">#{makhdom.customId}</span>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card">
            <span>Date of Birth</span>
            <strong>{formatDate(makhdom.dateOfBirth)}</strong>
          </div>

          <div className="stat-card">
            <span>Total Visits</span>
            <strong>{makhdom.visits?.length || 0}</strong>
          </div>
        </div>

        {/* VISITS */}
        <div className="visits-section">
          <h3>Visits</h3>
          {makhdom.visits?.length ? (
            <div className="visits-list-profile">
              {[...makhdom.visits].reverse().map((v, i) => (
                <div key={i} className="visit-card">
                  {formatDate(v)}
                </div>
              ))}
            </div>
          ) : (
            <p>No visits</p>
          )}
        </div>

        {/* TRANSFER */}
        <div className="transfer-box">
          <h3>Transfer Coins</h3>

          <input
            autoComplete="off"
            placeholder="To ID"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          />

          <input
            autoComplete="off"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            autoComplete="new-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleTransfer} disabled={transferring}>
            {transferring ? "Sending..." : "Send"}
          </button>
        </div>

        {/* TRANSACTIONS (FIXED DISPLAY) */}
        <div className="transactions-section">
          <h3>Transactions</h3>

          {transactions.length === 0 ? (
            <p>No transactions</p>
          ) : (
            transactions.map((t) => {
              const isSender = t.fromId === Number(customId);

              const fromName =
                t.fromId === 1 ? "San Giovanni" : t.fromName || t.fromId;

              const toName = t.toId === 1 ? "San Giovanni" : t.toName || t.toId;

              return (
                <div key={t.id} className="visit-card">
                  <b>{isSender ? "Sent" : "Received"}</b> {t.amount}
                  <br />
                  <small>
                    {fromName} → {toName}
                  </small>
                  <br />
                  <small>{formatDate(t.createdAt)}</small>
                </div>
              );
            })
          )}
        </div>

        {/* PASSWORD */}
        <div className="transfer-box">
          <h3>Change Password</h3>

          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />

          <button onClick={handleChangePassword} disabled={updatingPassword}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;