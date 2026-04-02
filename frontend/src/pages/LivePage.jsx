import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../App";
import LiveStreamCard from "../components/LiveStreamCard";
import PaymentModal from "../components/PaymentModal";

const FILTERS = [
  { key: "live",    icon: "bi-broadcast-pin",  label: "Live Now" },
  { key: "offline", icon: "bi-moon-stars-fill", label: "Scheduled" },
  { key: "ended",   icon: "bi-clock-history",   label: "Past Streams" },
];

export default function LivePage() {
  const { user }                      = useAuth();
  const navigate                      = useNavigate();
  const [streams, setStreams]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("live");
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
    <div className="ls-main">

      {/* ── Live viewer modal ───────────────────────────────── */}
      {viewingStream && (
        <div className="ls-modal-overlay" onClick={() => setViewing(null)}>
          <div
            className="ls-modal ls-modal--xl"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 0, overflow: "hidden" }}
          >
            {/* Viewer header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--sp-4) var(--sp-5)",
              borderBottom: "1px solid var(--stone-100)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                <div className={`ls-avatar ls-avatar--md ls-avatar--online`}>
                  {viewingStream.host?.profile_photo
                    ? <img src={viewingStream.host.profile_photo} alt="" />
                    : <i className="bi bi-person-fill" />}
                </div>
                <div>
                  <div style={{ fontWeight: "var(--weight-semi)", color: "var(--stone-900)", fontSize: "var(--text-base)" }}>
                    {viewingStream.host?.first_name || viewingStream.host?.username}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span className="ls-badge ls-badge--live">
                      <span className="ls-live-dot" style={{ width: 6, height: 6, background: "var(--white)" }} />
                      LIVE
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--stone-400)" }}>
                      <i className="bi bi-eye-fill" style={{ marginRight: 3 }} />
                      {viewingStream.viewers_count?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="ls-btn ls-btn--icon ls-btn--ghost"
                onClick={() => setViewing(null)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Player */}
            <div style={{
              background: "var(--stone-900)",
              aspectRatio: "16/9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "var(--sp-4)",
              color: "var(--white)",
            }}>
              {viewingStream.stream_url ? (
                <video
                  src={viewingStream.stream_url}
                  autoPlay
                  controls
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              ) : (
                <>
                  <i className="bi bi-broadcast-pin" style={{ fontSize: 52, color: "var(--red-400)", animation: "ls-heartbeat 2s ease-in-out infinite" }} />
                  <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontStyle: "italic" }}>
                    {viewingStream.host?.username} is live!
                  </p>
                  <small style={{ color: "var(--stone-400)" }}>Stream connecting…</small>
                </>
              )}
            </div>

            {/* Viewer footer */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--sp-4) var(--sp-5)",
              borderTop: "1px solid var(--stone-100)",
            }}>
              <div>
                <p style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: "var(--weight-semi)",
                  fontStyle: "italic",
                  color: "var(--stone-900)",
                }}>
                  {viewingStream.title}
                </p>
              </div>
              <button
                className="ls-btn ls-btn--primary"
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

      {/* ── Page hero ───────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, var(--stone-900) 0%, var(--stone-700) 100%)",
        padding: "clamp(40px, 6vw, 72px) var(--content-pad)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(224,26,79,.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: "var(--max-w)",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--sp-5)",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}>
          <div>
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <span className="ls-badge ls-badge--live">
                <span className="ls-live-dot" style={{ width: 7, height: 7, background: "var(--white)" }} />
                LIVE CAMERA
              </span>
            </div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(var(--text-2xl), 4vw, var(--text-4xl))",
              color: "var(--white)",
              fontStyle: "italic",
              marginBottom: "var(--sp-2)",
              lineHeight: "var(--leading-tight)",
            }}>
              Watch People <em style={{ color: "var(--red-400)" }}>Live</em>
            </h1>
            <p style={{ color: "var(--stone-400)", fontSize: "var(--text-md)", margin: 0 }}>
              Tune in to live broadcasts, or share your own moments.
            </p>
          </div>

          {user && (
            <Link
              to="/live/start"
              className="ls-btn ls-btn--primary ls-btn--lg"
              style={{ flexShrink: 0 }}
            >
              <i className="bi bi-camera-video-fill" /> Go Live
            </Link>
          )}
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="ls-subnav">
        <div className="ls-subnav__inner">
          {FILTERS.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`ls-subnav__link${filter === key ? " ls-subnav__link--active" : ""}`}
              onClick={() => setFilter(key)}
              style={{ background: "none", border: "none" }}
            >
              {key === "live" && filter === key && (
                <span className="ls-live-dot" style={{ marginRight: 4, flexShrink: 0 }} />
              )}
              {(key !== "live" || filter !== key) && <i className={`bi ${icon}`} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stream grid ─────────────────────────────────────── */}
      <div className="ls-container" style={{ paddingBlock: "var(--sp-8)" }}>

        {/* Section heading */}
        {!loading && streams.length > 0 && (
          <div className="ls-section-head" style={{ padding: "0 0 var(--sp-5)" }}>
            <h2>
              {filter === "live"    && <><em>On Air</em> <strong>Now</strong></>}
              {filter === "offline" && <><em>Coming</em> <strong>Up</strong></>}
              {filter === "ended"   && <><em>Recent</em> <strong>Streams</strong></>}
            </h2>
            <span className="ls-badge ls-badge--red-soft">
              {streams.length} stream{streams.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {loading ? (
          <SkeletonGrid />
        ) : streams.length === 0 ? (
          <div className="ls-empty" style={{ paddingBlock: "var(--sp-20)" }}>
            <div className="ls-empty__icon">
              <i className={`bi ${filter === "live" ? "bi-camera-video-off" : "bi-clock-history"}`} />
            </div>
            <h3>
              {filter === "live"
                ? "Nobody's live right now"
                : "No streams here yet"}
            </h3>
            <p>
              {filter === "live"
                ? "Be the first to go live and connect with others!"
                : "Check back later or explore other sections."}
            </p>
            {user && filter === "live" && (
              <Link
                to="/live/start"
                className="ls-btn ls-btn--primary"
                style={{ marginTop: "var(--sp-5)" }}
              >
                <i className="bi bi-camera-video-fill" /> Go Live Now
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
      </div>

      {/* Payment modal */}
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

// ── Skeleton loader ───────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="ls-video-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="ls-card"
          style={{ animation: `ls-fadeUp var(--dur-enter) var(--ease-out) ${i * 60}ms both` }}
        >
          <div
            className="ls-skeleton"
            style={{ aspectRatio: "16/9", borderRadius: 0 }}
          />
          <div style={{ padding: "var(--sp-3) var(--sp-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div className="ls-skeleton" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
              <div className="ls-skeleton" style={{ height: 12, width: "45%", borderRadius: 6 }} />
            </div>
            <div className="ls-skeleton" style={{ height: 14, width: "80%", borderRadius: 6, marginBottom: 8 }} />
            <div className="ls-skeleton" style={{ height: 11, width: "55%", borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}