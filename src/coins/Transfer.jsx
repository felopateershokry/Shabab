import React from "react";
import { Link } from "react-router-dom";
import "./Transfer.css";

function Transfer() {
  return (
    <div className="transfer-container">
      <Link to="/send-coins" className="transfer-card deposit">
        <h2>إيداع</h2>
        <p>إرسال نسر جنية</p>
      </Link>

      <Link to="/recieve-coins" className="transfer-card withdraw">
        <h2>سحب</h2>
        <p>سحب نسر جنية</p>
      </Link>

      {/* 🆕 Transactions page */}
      <Link to="/transfers" className="transfer-card history">
        <h2>العمليات</h2>
        <p>عرض سجل التحويلات</p>
      </Link>
    </div>
  );
}

export default Transfer;
