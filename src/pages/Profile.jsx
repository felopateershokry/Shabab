import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./Profile.css";

function Profile() {
  const { customId } = useParams();

  const [makhdom, setMakhdom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMakhdom = async () => {
      try {
        const q = query(
          collection(db, "makhdom"),
          where("customId", "==", Number(customId)),
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setMakhdom(querySnapshot.docs[0].data());
        } else {
          setMakhdom(null);
        }
      } catch (error) {
        console.error(error);
        setMakhdom(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMakhdom();
  }, [customId]);

  // YYYY-MM-DD format (same as SinglePage)
  const formatDate = (value) => {
    if (!value) return "-";

    if (value?.seconds) {
      return new Date(value.seconds * 1000).toLocaleDateString("en-CA");
    }

    return value;
  };

  const formatVisit = (visit) => {
    if (!visit) return "-";

    if (visit?.seconds) {
      return new Date(visit.seconds * 1000).toLocaleDateString("en-CA");
    }

    return String(visit);
  };

  if (loading) return <h2>Loading...</h2>;

  if (!makhdom) return <h2>Makhdom not found</h2>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="coins-badge">🪙 {makhdom.coins ?? 0}</div>

        {makhdom.image && (
          <img
            src={makhdom.image}
            alt={makhdom.name}
            className="profile-image"
          />
        )}

        <h1>{makhdom.name}</h1>
        <span className="profile-id">#{makhdom.customId}</span>

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

        <div className="visits-section">
          <h3>📅 Visits History</h3>

          {makhdom.visits?.length ? (
            <div className="visits-list-profile">
              {[...makhdom.visits].reverse().map((visit, index) => (
                <div key={index} className="visit-card">
                  {formatVisit(visit)}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-visits">No visits yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
