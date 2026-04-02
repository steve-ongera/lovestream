import React from "react";
import { Link } from "react-router-dom";

export default function LiveStreamCard({ stream, onWatch }) {
  const isLive = stream.status === "live";
  const isPaid = Number(stream.access_price) > 0;

  return (
    <div className="ls-card">

      {/* ── Thumbnail ─────────────────────────────────────────────── */}
      <div className="ls-card__thumb" style={{ cursor: "pointer" }} onClick={onWatch}>
        {stream.thumbnail ? (
          <img src={stream.thumbnail} alt={stream.title} loading="lazy" />
        ) : (
          <div
            className="ls-flex-center"
            style={{
              width: "100%",
              height: "100%",
              background: "var(--stone-100)",
              color: "var(--stone-400)",
              fontSize: 40,
            }}
          >
            <i className="bi bi-broadcast-pin" />
          </div>
        )}

        {/* Play overlay */}
        <div className="ls-card__play-overlay">
          <div className="ls-card__play-icon">
            <i className="bi bi-play-fill" />
          </div>
        </div>

        {/* Top-left badges */}
        <div className="ls-card__badges">
          {isLive && (
            <span className="ls-badge ls-badge--live">
              <span className="ls-live-dot" /> LIVE
            </span>
          )}
          {isPaid && !stream.has_access && (
            <span className="ls-badge ls-badge--gold">
              <i className="bi bi-gem" /> KES {Number(stream.access_price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Lock overlay for paid streams */}
        {isPaid && !stream.has_access && (
          <div className="ls-card__lock">
            <i className="bi bi-lock-fill" />
            <span>KES {Number(stream.access_price).toLocaleString()}</span>
          </div>
        )}

        {/* Viewer count — bottom right */}
        {isLive && (
          <span className="ls-card__duration">
            <i className="bi bi-eye-fill" />{" "}
            {stream.viewers_count?.toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="ls-card__body">
        {/* Host row */}
        <div className="ls-card__uploader">
          <div
            className={`ls-avatar ls-avatar--xs${
              stream.host?.is_online ? " ls-avatar--online" : ""
            }`}
          >
            {stream.host?.profile_photo ? (
              <img src={stream.host.profile_photo} alt="" />
            ) : (
              <i className="bi bi-person-fill" />
            )}
          </div>
          <Link
            to={`/profile/${stream.host?.slug}`}
            className="ls-card__uploader-name"
            onClick={(e) => e.stopPropagation()}
          >
            {stream.host?.first_name || stream.host?.username}
          </Link>
        </div>

        <h3 className="ls-card__title">{stream.title}</h3>

        <div className="ls-card__stats">
          {isLive ? (
            <span>
              <i className="bi bi-eye-fill" />{" "}
              {stream.viewers_count?.toLocaleString()} watching
            </span>
          ) : (
            <span>
              <i className="bi bi-clock" /> {stream.status}
            </span>
          )}
          {isPaid && (
            <span>
              <i className="bi bi-gem" /> KES{" "}
              {Number(stream.access_price).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className="ls-card__actions">
        <button className="ls-card__action-btn" onClick={onWatch}>
          {isLive ? (
            <><i className="bi bi-play-fill" /> Watch Live</>
          ) : (
            <><i className="bi bi-info-circle" /> Details</>
          )}
        </button>
        <Link
          to={`/profile/${stream.host?.slug}`}
          className="ls-card__action-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="bi bi-person" /> Profile
        </Link>
      </div>
    </div>
  );
}