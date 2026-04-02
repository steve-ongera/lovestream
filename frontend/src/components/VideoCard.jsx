import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";

function fmtDuration(s) {
  if (!s) return "";
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function VideoCard({ video, onLikeToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = React.useState(video.is_liked);
  const [likes, setLikes] = React.useState(video.likes_count);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    try {
      const res = await api.toggleLike(video.slug);
      setLiked(res.liked);
      setLikes((l) => l + (res.liked ? 1 : -1));
      onLikeToggle?.(res.liked);
    } catch (_) {}
  };

  const isPaid    = video.access_type === "paid";
  const hasAccess = video.has_access;

  return (
    <Link to={`/videos/${video.slug}`} className="ls-card">

      {/* ── Thumbnail ─────────────────────────────────────────────── */}
      <div className="ls-card__thumb">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} loading="lazy" />
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
            <i className="bi bi-play-circle" />
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
          {isPaid && !hasAccess ? (
            <span className="ls-badge ls-badge--gold">
              <i className="bi bi-gem" /> Premium
            </span>
          ) : (
            <span className="ls-badge ls-badge--dark">
              <i className="bi bi-unlock" /> Free
            </span>
          )}
        </div>

        {/* Lock overlay for paid content */}
        {isPaid && !hasAccess && (
          <div className="ls-card__lock">
            <i className="bi bi-lock-fill" />
            <span>KES {Number(video.price).toLocaleString()}</span>
          </div>
        )}

        {/* Price ribbon — bottom left */}
        {isPaid && !hasAccess && (
          <div className="ls-card__price">
            <i className="bi bi-gem" /> KES {Number(video.price).toLocaleString()}
          </div>
        )}

        {/* Duration — bottom right */}
        {video.duration_seconds > 0 && (
          <span className="ls-card__duration">
            {fmtDuration(video.duration_seconds)}
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="ls-card__body">
        {/* Uploader row */}
        <div className="ls-card__uploader">
          <div
            className={`ls-avatar ls-avatar--xs${
              video.uploader?.is_online ? " ls-avatar--online" : ""
            }`}
          >
            {video.uploader?.profile_photo ? (
              <img src={video.uploader.profile_photo} alt="" />
            ) : (
              <i className="bi bi-person-fill" />
            )}
          </div>
          <span className="ls-card__uploader-name">
            {video.uploader?.first_name || video.uploader?.username}
          </span>
        </div>

        <h3 className="ls-card__title ls-truncate-2">{video.title}</h3>

        <div className="ls-card__stats">
          <span>
            <i className="bi bi-eye-fill" /> {video.views_count?.toLocaleString()}
          </span>
          <span>
            <i className="bi bi-heart-fill" style={{ color: "var(--red-400)" }} />{" "}
            {likes?.toLocaleString()}
          </span>
          <span>
            <i className="bi bi-chat-fill" /> {video.comments_count?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div
        className="ls-card__actions"
        onClick={(e) => e.preventDefault()}
      >
        <button
          className={`ls-card__action-btn${liked ? " ls-card__action-btn--liked" : ""}`}
          onClick={handleLike}
        >
          <i className={`bi bi-heart${liked ? "-fill" : ""}`} />
          {liked ? "Liked" : "Like"}
        </button>
        <Link
          to={`/videos/${video.slug}`}
          className="ls-card__action-btn"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="bi bi-play-fill" /> Watch
        </Link>
      </div>
    </Link>
  );
}