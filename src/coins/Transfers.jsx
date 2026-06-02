import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import "./Transfers.css";

const SAN_GIOVANNI_ID = 1;

const isSanGiovanni = (t) =>
  t.fromId === SAN_GIOVANNI_ID || t.toId === SAN_GIOVANNI_ID;

const resolveName = (id, name) =>
  id === SAN_GIOVANNI_ID ? "San Giovanni" : name || `#${id}`;

const getCardMeta = (t) => {
  if (t.type === "send") return { label: "إيداع", cls: "deposit" };
  if (t.type === "receive") return { label: "سحب", cls: "withdraw" };
  return { label: "تحويل", cls: "transfer" };
};

function TransferCard({ t }) {
  const { label, cls } = getCardMeta(t);
  return (
    <div className={`tr-card ${cls}`}>
      <div className="tr-top">
        <span className="tr-type">{label}</span>
        <span className="tr-amount">{t.amount} 🪙</span>
      </div>
      <span className="tr-route">
        {resolveName(t.fromId, t.fromName)}
        <span className="tr-arrow"> ← </span>
        {resolveName(t.toId, t.toName)}
      </span>
    </div>
  );
}

function Section({ title, icon, transfers, emptyMsg, accent }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={`tr-section ${accent} ${open ? "is-open" : "is-closed"}`}>
      {/* ── Header (always visible, clickable) ── */}
      <button
        className="tr-section-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="tr-section-icon">{icon}</span>
        <h3 className="tr-section-title">{title}</h3>
        <span className="tr-section-count">{transfers.length}</span>
        <span className="tr-chevron">▲</span>
      </button>

      {/* ── Collapsible body — always mounted for CSS animation ── */}
      <div className={`tr-section-body ${open ? "body-open" : "body-closed"}`}>
        <div className="tr-section-list">
          {transfers.length === 0 ? (
            <p className="tr-empty">{emptyMsg}</p>
          ) : (
            transfers.map((t) => <TransferCard key={t.id} t={t} />)
          )}
        </div>
      </div>
    </div>
  );
}

function Transfers() {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const unsub = onSnapshot(collection(db, "transfers"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
      setTransfers(data);
    });
    return () => unsub();
  }, []);

  const sgTransfers = transfers.filter(isSanGiovanni);
  const otherTransfers = transfers.filter((t) => !isSanGiovanni(t));

  return (
    <div className="tr-root" dir="rtl">
      <div className="tr-page-header">
        <h2 className="tr-page-title">سجل المعاملات</h2>
        <span className="tr-total-badge">{transfers.length} معاملة</span>
      </div>

      <div className="tr-columns">
        <Section
          title="المعاملات الرسمية"
          icon="🏛️"
          transfers={sgTransfers}
          emptyMsg="لا توجد معاملات مع San Giovanni"
          accent="accent-gold"
        />
        <Section
          title="التحويلات بين الأعضاء"
          icon="🔄"
          transfers={otherTransfers}
          emptyMsg="لا توجد تحويلات بين الأعضاء"
          accent="accent-blue"
        />
      </div>
    </div>
  );
}

export default Transfers;
