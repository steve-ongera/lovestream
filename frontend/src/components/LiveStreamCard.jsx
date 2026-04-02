//LiveStreamCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function LiveStreamCard({ stream, onWatch }) {
  const isLive  = stream.status === "live";
  const isPaid  = Number(stream.access_price) > 0;

  return (
    <div className="ls-card">
      <div className="ls-card__thumb" style={{ cursor: "pointer" }} onClick={onWatch}>
        {stream.thumbnail
          ? <img src={stream.thumbnail} alt={stream.title} loading="lazy" />
          : (
            <div className="ls-card__thumb-placeholder ls-card__thumb-placeholder--stream">
              <i className="bi bi-broadcast-pin" />
            </div>
          )}

        {isLive && (
          <span className="ls-card__badge ls-card__badge--live">
            <span className="ls-live-dot" /> LIVE
          </span>
        )}

        {isPaid && !stream.has_access && (
          <div className="ls-card__lock">
            <i className="bi bi-lock-fill" />
            <span>KES {Number(stream.access_price).toLocaleString()}</span>
          </div>
        )}

        {isLive && (
          <span className="ls-card__duration">
            <i className="bi bi-eye-fill" /> {stream.viewers_count?.toLocaleString()}
          </span>
        )}
      </div>

      <div className="ls-card__body">
        <div className="ls-card__uploader">
          <div className="ls-card__avatar">
            {stream.host?.profile_photo
              ? <img src={stream.host.profile_photo} alt="" />
              : <i className="bi bi-person-circle" />}
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
          {isLive
            ? <span><i className="bi bi-eye-fill" /> {stream.viewers_count?.toLocaleString()} watching</span>
            : <span><i className="bi bi-clock" /> {stream.status}</span>}
          {isPaid && (
            <span><i className="bi bi-gem" /> KES {Number(stream.access_price).toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className="ls-card__actions">
        <button className="ls-card__action-btn" onClick={onWatch}>
          {isLive
            ? <><i className="bi bi-play-fill" /> Watch Live</>
            : <><i className="bi bi-info-circle" /> Details</>}
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