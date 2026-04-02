import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";
import LiveStreamCard from "../components/LiveStreamCard";
import PaymentModal from "../components/PaymentModal";

export default function LivePage() {
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [streams, setStreams]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("live");
  const [selectedStream, setSelected] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [viewingStream, setViewing]   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getStreams({ status: filter })
      .then((d) => setStreams(d.results || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const handleWatch = (stream) => {
    if (!user) { navigate("/login"); return; }
    if (Number(stream.access_price) === 0 || stream.has_access) {
      setViewing(stream);
    } else {
      setSelected(stream);
      setShowPayment(true);
    }
  };

  return (
    <div className="ls-live-page">
      {/* Viewing overlay */}
      {viewingStream && (
        <div className="ls-modal-overlay" onClick={() => setViewing(null)}>
          <div className="ls-live-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="ls-live-viewer__header">
              <div className="ls-live-viewer__host">
                <div className="ls-card__avatar">
                  {viewingStream.host?.profile_photo
                    ? <img src={viewingStream.host.profile_photo} alt="" />
                    : <i className="bi bi-person-circle" />}
                </div>
                <div>
                  <strong>{viewingStream.host?.first_name || viewingStream.host?.username}</strong>
                  <span className="ls-live-viewer__live-tag">
                    <span className="ls-live-dot" /> LIVE
                  </span>
                </div>
              </div>
              <div className="ls-live-viewer__viewers">
                <i className="bi bi-eye-fill" /> {viewingStream.viewers_count.toLocaleString()}
              </div>
              <button className="ls-live-viewer__close" onClick={() => setViewing(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Stream player */}
            <div className="ls-live-viewer__player">
              {viewingStream.stream_url ? (
                <video src={viewingStream.stream_url} autoPlay controls className="ls-player" />
              ) : (
                <div className="ls-player-placeholder">
                  <i className="bi bi-broadcast-pin" />
                  <p>{viewingStream.host?.username} is live!</p>
                  <small>Stream connecting…</small>
                </div>
              )}
            </div>

            <div className="ls-live-viewer__footer">
              <h4>{viewingStream.title}</h4>
              <button
                className="ls-btn ls-btn--primary ls-btn--sm"
                onClick={async () => {
                  if (!user) { navigate("/login"); return; }
                  const conv = await api.startConversation(viewingStream.host.id);
                  navigate(`/messages?conversation=${conv.id}`);
                  setViewing(null);
                }}
              >
                <i className="bi bi-chat-heart-fill" /> DM Host
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="ls-live-page__hero">
        <div className="ls-live-page__hero-inner">
          <div>
            <h1><i className="bi bi-broadcast-pin" /> Live Camera</h1>
            <p>Watch people broadcast live — or go live yourself.</p>
          </div>
          {user && (
            <Link to="/live/start" className="ls-btn ls-btn--primary">
              <i className="bi bi-camera-video-fill" /> Go Live
            </Link>
          )}
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="ls-filter-bar">
        <div className="ls-filter-bar__inner">
          {["live", "offline", "ended"].map((s) => (
            <button
              key={s}
              className={`ls-filter-btn${filter === s ? " ls-filter-btn--active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "live"    && <><span className="ls-live-dot" style={{ marginRight: 6 }} /> Live Now</>}
              {s === "offline" && <><i className="bi bi-moon-stars" /> Scheduled</>}
              {s === "ended"   && <><i className="bi bi-clock-history" /> Past Streams</>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonGrid />
      ) : streams.length === 0 ? (
        <div className="ls-empty" style={{ padding: "80px 20px" }}>
          <i className="bi bi-camera-video-off" />
          <p>
            {filter === "live"
              ? "Nobody is live right now. Why not start your own stream?"
              : "No streams in this category."}
          </p>
          {user && filter === "live" && (
            <Link to="/live/start" className="ls-btn ls-btn--primary" style={{ marginTop: 16 }}>
              <i className="bi bi-camera-video-fill" /> Go Live
            </Link>
          )}
        </div>
      ) : (
        <div className="ls-video-grid">
          {streams.map((s) => (
            <LiveStreamCard
              key={s.id}
              stream={s}
              onWatch={() => handleWatch(s)}
            />
          ))}
        </div>
      )}

      {showPayment && selectedStream && (
        <PaymentModal
          title={`Access ${selectedStream.host?.username}'s live stream`}
          amount={selectedStream.access_price}
          liveStreamId={selectedStream.id}
          onClose={() => { setShowPayment(false); setSelected(null); }}
          onSuccess={() => {
            setShowPayment(false);
            setViewing({ ...selectedStream, has_access: true });
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="ls-video-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="ls-skeleton-card">
          <div className="ls-skeleton ls-skeleton--thumb" />
          <div style={{ padding: 12 }}>
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "80%", marginBottom: 8 }} />
            <div className="ls-skeleton ls-skeleton--line" style={{ width: "55%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}