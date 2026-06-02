import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Transfers.css";

function Transfers() {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transfers"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // newest first
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );

      setTransfers(data);
    });

    return () => unsub();
  }, []);

  return (
    <div className="transfers-container">
      <h2 className="title">Transactions History</h2>

      <div className="transfers-list">
        {transfers.map((t) => (
          <div
            key={t.id}
            className={`transfer-card ${
              t.type === "send" ? "send" : "receive"
            }`}
          >
            <div className="top-row">
              <span className="type">
                {t.type === "send" ? "إيداع" : "سحب"}
              </span>

              <span className="amount">{t.amount} Coins</span>
            </div>

            <div className="info">
              <p>
                <strong>From:</strong> {t.fromName}
              </p>
              <p>
                <strong>To:</strong> {t.toName}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Transfers;
