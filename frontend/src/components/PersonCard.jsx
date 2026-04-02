import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";

export default function PersonCard({ user: person, onMatch }) {
  const { user: me } = useAuth();
  const navigate     = useNavigate();
  const [matched, setMatched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!me) { navigate("/login"); return; }
    setLoading(true);
    try {
      await api.sendMatch(person.id);
      setMatched(true);
      onMatch?.();
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handleDM = async (e) => {
    e.preventDefault();
    if (!me) { navigate("/login"); return; }
    const conv = await api.startConversation(person.id);
    navigate(`/messages?conversation=${conv.id}`);
  };

  return (
    <Link to={`/profile/${person.slug}`} className="ls-person-card">

      {/* ── Cover gradient ────────────────────────────────────────── */}
      <div className="ls-person-card__cover" />

      {/* ── Avatar ───────────────────────────────────────────────── */}
      <div className="ls-person-card__photo">
        {person.profile_photo ? (
          <img src={person.profile_photo} alt={person.username} />
        ) : (
          <i className="bi bi-person-circle" />
        )}
      </div>

      {/* ── Online badge ─────────────────────────────────────────── */}
      {person.is_online && (
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span className="ls-badge ls-badge--red-soft" style={{ fontSize: 10 }}>
            <span className="ls-live-dot" style={{ width: 6, height: 6 }} /> Online
          </span>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="ls-person-card__body">

        {/* Name + age */}
        <h3 className="ls-person-card__name">
          {person.first_name || person.username}
          {person.age && (
            <span style={{ fontWeight: 400, fontSize: 16 }}>, {person.age}</span>
          )}
        </h3>

        {/* Location */}
        <p className="ls-person-card__meta">
          {person.city || person.country ? (
            <>
              <i className="bi bi-geo-alt-fill" style={{ color: "var(--red-400)", fontSize: 12 }} />
              {[person.city, person.country].filter(Boolean).join(", ")}
            </>
          ) : (
            "Unknown location"
          )}
        </p>

        {/* Attribute pills */}
        <div className="ls-person-card__attrs">
          {person.height_cm && (
            <span className="ls-pill">
              <i className="bi bi-arrows-vertical" /> {person.height_cm} cm
            </span>
          )}
          {person.skin_texture && (
            <span className="ls-pill">{person.skin_texture}</span>
          )}
          {person.relationship_goal && (
            <span className="ls-pill">
              <i className="bi bi-heart-arrow" /> {person.relationship_goal}
            </span>
          )}
          {person.is_premium && (
            <span className="ls-pill">
              <i className="bi bi-gem" /> Premium
            </span>
          )}
        </div>

        {/* Actions — stop propagation so the Link wrapper doesn't fire */}
        <div
          className="ls-person-card__actions"
          onClick={(e) => e.preventDefault()}
        >
          <button
            className={`ls-btn ls-btn--sm${
              matched ? " ls-btn--ghost" : " ls-btn--primary"
            }`}
            onClick={handleMatch}
            disabled={matched || loading}
            title={matched ? "Match sent!" : "Send match request"}
          >
            <i className={`bi bi-heart${matched ? "-fill" : "-arrow"}`} />
            {matched ? "Matched!" : "Match"}
          </button>

          <button
            className="ls-btn ls-btn--outline ls-btn--sm ls-btn--icon"
            onClick={handleDM}
            title="Send message"
          >
            <i className="bi bi-chat-dots-fill" />
          </button>
        </div>
      </div>
    </Link>
  );
}