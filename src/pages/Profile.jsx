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

/* ─── Confirmation Modal ──────────────────────────────────────── */
function ConfirmModal({ data, makhdomPassword, onConfirm, onCancel }) {
  const [modalPassword, setModalPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleConfirm = () => {
    if (!modalPassword) {
      setError("أدخل كلمة المرور");
      return;
    }
    if (modalPassword !== makhdomPassword) {
      setError("كلمة المرور خاطئة");
      return;
    }
    onConfirm();
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🪙</div>
        <h3 className="modal-title">تأكيد التحويل</h3>
        <p className="modal-sub">هتبعت</p>
        <div className="modal-amount">{data.amount} نسر جنية</div>
        <p className="modal-sub">
          إلى{" "}
          <strong>
            {Number(data.toId) === 1
              ? "San Giovanni"
              : data.toName || `#${data.toId}`}
          </strong>
        </p>
        <div className="modal-pass-wrap">
          <input
            className="modal-pass-input"
            type="password"
            placeholder="كلمة المرور"
            autoComplete="new-password"
            autoFocus
            value={modalPassword}
            onChange={(e) => {
              setModalPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
          {error && <span className="modal-pass-error">{error}</span>}
        </div>
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onCancel}>
            إلغاء
          </button>
          <button className="modal-btn confirm" onClick={handleConfirm}>
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Panel IDs ───────────────────────────────────────────────── */
const PANELS = {
  VISITS: "visits",
  TRANSFERS: "transfers",
  SEND: "send",
  PASSWORD: "password",
};

function Profile() {
  const { customId } = useParams();

  const [makhdom, setMakhdom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);

  /* Transfer form */
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState(null);

  /* Password form */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchMakhdom();
    fetchTransactions();
  }, [customId]);

  /* ── Fetch user ─────────────────────────────── */
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
    } catch {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch transactions ─────────────────────── */
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
        _dir: "sent",
        ...d.data(),
      }));
      const received = s2.docs.map((d) => ({
        id: d.id,
        _dir: "received",
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

  /* ── Format date ────────────────────────────── */
  const formatDate = (v) => {
    if (!v) return "-";
    if (v?.seconds)
      return new Date(v.seconds * 1000).toLocaleDateString("ar-EG");
    return v;
  };

  /* ── Toggle panel ───────────────────────────── */
  const togglePanel = (id) => setActivePanel((cur) => (cur === id ? null : id));

  /* ── Pre-validate & show confirmation modal ─── */
  const handleTransferRequest = async () => {
    const value = Number(amount);
    if (!toId || !amount) return toast.error("أكمل جميع الحقول");
    if (value <= 0) return toast.error("المبلغ غير صالح");
    if (Number(toId) === Number(customId))
      return toast.error("لا يمكنك التحويل لنفسك");
    if ((makhdom.coins || 0) < value) return toast.error("رصيد غير كافٍ");

    /* ID = 1 → San Giovanni (لا داعي للبحث في الداتابيز) */
    if (Number(toId) === 1) {
      setPendingTransfer({ toId: 1, toName: "San Giovanni", amount: value });
      return;
    }

    /* التحقق من وجود المستقبل — مطلوب قبل إظهار الـ modal */
    let toName = null;
    try {
      const rQ = query(
        collection(db, "makhdom"),
        where("customId", "==", Number(toId)),
      );
      const rSnap = await getDocs(rQ);
      if (rSnap.empty) {
        return toast.error("المستخدم غير موجود");
      }
      toName = rSnap.docs[0].data().name || String(toId);
    } catch {
      return toast.error("فشل التحقق من المستخدم");
    }

    setPendingTransfer({ toId, toName, amount: value });
  };

  /* ── Execute confirmed transfer ─────────────── */
  const executeTransfer = async () => {
    if (!pendingTransfer || transferring) return;
    const saved = { ...pendingTransfer };
    setPendingTransfer(null);
    setTransferring(true);
    const loadingToast = toast.loading("جاري التحويل...");

    try {
      const senderQ = query(
        collection(db, "makhdom"),
        where("customId", "==", Number(customId)),
      );
      const senderSnap = await getDocs(senderQ);
      const sender = senderSnap.docs[0];
      if (!sender) throw new Error("المرسل غير موجود");
      const senderData = sender.data();
      if ((senderData.coins || 0) < saved.amount)
        throw new Error("رصيد غير كافٍ");

      // ID = 1 → San Giovanni (لا يوجد doc في الداتابيز، بس نخصم ونسجل)
      const isSanGiovanni = Number(saved.toId) === 1;
      let resolvedToName = "San Giovanni";

      if (!isSanGiovanni) {
        const receiverQ = query(
          collection(db, "makhdom"),
          where("customId", "==", Number(saved.toId)),
        );
        const receiverSnap = await getDocs(receiverQ);
        const receiver = receiverSnap.docs[0];

        // المستخدم لازم يكون موجود — نتأكد قبل أي خصم
        if (!receiver) throw new Error("المستخدم المستقبل غير موجود");

        const receiverData = receiver.data();
        resolvedToName = receiverData.name || String(saved.toId);

        // نضيف للمستقبل
        await updateDoc(doc(db, "makhdom", receiver.id), {
          coins: (receiverData.coins || 0) + saved.amount,
        });
      }

      // نخصم من المرسل
      await updateDoc(doc(db, "makhdom", sender.id), {
        coins: senderData.coins - saved.amount,
      });

      await addDoc(collection(db, "transfers"), {
        fromId: Number(customId),
        toId: Number(saved.toId),
        fromName: makhdom.name || String(customId),
        toName: resolvedToName,
        amount: saved.amount,
        type: "transfer",
        createdAt: serverTimestamp(),
      });

      toast.update(loadingToast, {
        render: "تم التحويل بنجاح ✓",
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

  /* ── Change password ────────────────────────── */
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword)
      return toast.error("أكمل جميع الحقول");
    if (currentPassword !== makhdom?.password)
      return toast.error("كلمة المرور الحالية خاطئة");
    if (newPassword !== confirmNewPassword)
      return toast.error("كلمات المرور غير متطابقة");

    setUpdatingPassword(true);
    const t = toast.loading("جاري التحديث...");
    try {
      await updateDoc(doc(db, "makhdom", makhdom.id), {
        password: newPassword,
      });
      toast.update(t, {
        render: "تم تحديث كلمة المرور ✓",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      window.location.reload();
    } catch {
      toast.update(t, {
        render: "فشل التحديث",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  /* ── TX card meta ───────────────────────────── */
  const getTxMeta = (t) => {
    const isSender = t.fromId === Number(customId);
    if (t.type === "send")
      return { label: "إيداع", cls: "tx-deposit", icon: "⬇" };
    if (t.type === "receive")
      return { label: "سحب", cls: "tx-withdraw", icon: "⬆" };
    return {
      label: isSender ? "تحويل — أرسلت" : "تحويل — استلمت",
      cls: isSender ? "tx-transfer-out" : "tx-transfer-in",
      icon: isSender ? "↗" : "↙",
    };
  };

  const resolveName = (id, name) => {
    if (id === 1) return "San Giovanni";
    return name || `#${id}`;
  };

  /* ── Render ─────────────────────────────────── */
  if (loading)
    return (
      <div className="p-loading">
        <div className="p-spinner" />
      </div>
    );
  if (!makhdom) return <div className="p-loading">المستخدم غير موجود</div>;

  return (
    <div className="p-root" dir="rtl">
      <ToastContainer position="top-center" rtl />

      {/* ── Confirmation Modal ── */}
      {pendingTransfer && (
        <ConfirmModal
          data={pendingTransfer}
          makhdomPassword={makhdom?.password}
          onConfirm={executeTransfer}
          onCancel={() => setPendingTransfer(null)}
        />
      )}

      {/* ── Hero ── */}
      <div className="p-hero">
        <div className="p-avatar">{(makhdom.name || "?")[0].toUpperCase()}</div>
        <div className="p-hero-info">
          <h1 className="p-name">{makhdom.name}</h1>
          <span className="p-id">#{makhdom.customId}</span>
        </div>
        <div className="p-coins-pill">
          <span className="p-coin-icon">🪙</span>
          <span className="p-coin-val">{makhdom.coins ?? 0}</span>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="p-stats">
        <div className="p-stat">
          <span className="p-stat-val">{makhdom.visits?.length || 0}</span>
          <span className="p-stat-lbl">زيارة</span>
        </div>
        <div className="p-stat-divider" />
        <div className="p-stat">
          <span className="p-stat-val">{transactions.length}</span>
          <span className="p-stat-lbl">معاملة</span>
        </div>
        <div className="p-stat-divider" />
        <div className="p-stat">
          <span className="p-stat-val p-stat-dob">
            {formatDate(makhdom.dateOfBirth)}
          </span>
          <span className="p-stat-lbl">تاريخ الميلاد</span>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="p-actions">
        <button
          className={`p-action-btn ${activePanel === PANELS.VISITS ? "active" : ""}`}
          onClick={() => togglePanel(PANELS.VISITS)}
        >
          <span className="p-action-icon">📅</span>
          <span>الزيارات</span>
        </button>

        <button
          className={`p-action-btn ${activePanel === PANELS.TRANSFERS ? "active" : ""}`}
          onClick={() => togglePanel(PANELS.TRANSFERS)}
        >
          <span className="p-action-icon">📋</span>
          <span>المعاملات</span>
        </button>

        <button
          className={`p-action-btn send ${activePanel === PANELS.SEND ? "active" : ""}`}
          onClick={() => togglePanel(PANELS.SEND)}
        >
          <span className="p-action-icon">💸</span>
          <span>تحويل</span>
        </button>

        <button
          className={`p-action-btn ghost ${activePanel === PANELS.PASSWORD ? "active" : ""}`}
          onClick={() => togglePanel(PANELS.PASSWORD)}
          title="تغيير كلمة المرور"
        >
          <span className="p-action-icon">🔑</span>
        </button>
      </div>

      {/* ══════════════════════════════
          PANEL: VISITS
      ══════════════════════════════ */}
      {activePanel === PANELS.VISITS && (
        <div className="p-panel">
          <div className="p-panel-header">
            <span className="p-panel-title">📅 سجل الزيارات</span>
            <button
              className="p-panel-close"
              onClick={() => setActivePanel(null)}
            >
              ✕
            </button>
          </div>

          {makhdom.visits?.length ? (
            <div className="p-visits-grid">
              {[...makhdom.visits].reverse().map((v, i) => (
                <div key={i} className="p-visit-chip">
                  {formatDate(v)}
                </div>
              ))}
            </div>
          ) : (
            <p className="p-empty">لا توجد زيارات مسجلة</p>
          )}
        </div>
      )}

      {/* ══════════════════════════════
          PANEL: TRANSACTIONS
      ══════════════════════════════ */}
      {activePanel === PANELS.TRANSFERS && (
        <div className="p-panel">
          <div className="p-panel-header">
            <span className="p-panel-title">📋 سجل المعاملات</span>
            <button
              className="p-panel-close"
              onClick={() => setActivePanel(null)}
            >
              ✕
            </button>
          </div>

          {transactions.length === 0 ? (
            <p className="p-empty">لا توجد معاملات</p>
          ) : (
            <div className="p-tx-list">
              {transactions.map((t) => {
                const { label, cls, icon } = getTxMeta(t);
                const fromName = resolveName(t.fromId, t.fromName);
                const toName = resolveName(t.toId, t.toName);
                return (
                  <div key={t.id} className={`p-tx-card ${cls}`}>
                    <div className="p-tx-left">
                      <span className="p-tx-icon">{icon}</span>
                      <div className="p-tx-details">
                        <span className="p-tx-label">{label}</span>
                        <span className="p-tx-route">
                          {fromName} ← {toName}
                        </span>
                        <span className="p-tx-date">
                          {formatDate(t.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="p-tx-amount">{t.amount} 🪙</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════
          PANEL: SEND / TRANSFER
      ══════════════════════════════ */}
      {activePanel === PANELS.SEND && (
        <div className="p-panel">
          <div className="p-panel-header">
            <span className="p-panel-title">💸 تحويل نسر جنية</span>
            <button
              className="p-panel-close"
              onClick={() => setActivePanel(null)}
            >
              ✕
            </button>
          </div>

          <div className="p-balance-hint">
            رصيدك الحالي: <strong>{makhdom.coins ?? 0} 🪙</strong>
          </div>

          <div className="p-form">
            <label className="p-label">ID المستقبل</label>
            <input
              className="p-input"
              autoComplete="off"
              placeholder="أدخل الـ ID"
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            />

            <label className="p-label">المبلغ</label>
            <input
              className="p-input"
              autoComplete="off"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button
              className="p-submit-btn"
              onClick={handleTransferRequest}
              disabled={transferring}
            >
              {transferring ? "جاري الإرسال..." : "متابعة →"}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          PANEL: PASSWORD
      ══════════════════════════════ */}
      {activePanel === PANELS.PASSWORD && (
        <div className="p-panel">
          <div className="p-panel-header">
            <span className="p-panel-title">🔑 تغيير كلمة المرور</span>
            <button
              className="p-panel-close"
              onClick={() => setActivePanel(null)}
            >
              ✕
            </button>
          </div>

          <div className="p-form">
            <label className="p-label">كلمة المرور الحالية</label>
            <input
              className="p-input"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <label className="p-label">كلمة المرور الجديدة</label>
            <input
              className="p-input"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label className="p-label">تأكيد كلمة المرور الجديدة</label>
            <input
              className="p-input"
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />

            <button
              className="p-submit-btn ghost-btn"
              onClick={handleChangePassword}
              disabled={updatingPassword}
            >
              {updatingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
